// This is only used in a browser context

import { CircularTypedArray } from '../../utils/circularTypedArray';
import { AudioChunkStreamOutput } from '../../utils/audio/chunk_stream';
import { isBrowser } from '../../utils/environment/isBrowser';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import { WebAudioSinkDescriptor } from './sink_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { AudioInstance } from '../utils';
import { MAX_LATENCY, OPUS_ENCODER_CHUNK_SAMPLES_COUNT, OPUS_ENCODER_RATE } from '../../utils/constants';
import { NumericStatsTracker } from '../../utils/basicNumericStatsTracker';
import { DriftAwareAudioBufferTransformer } from '../../utils/audio/synchronizedAudioBuffer';

const AUDIO_DRIFT_HISTORY_INTERVAL = 50;
const AUDIO_DRIFT_HISTORY_DURATION = 2 * 60 * 1000;

export const isWebAudioAvailable = () => typeof AudioContext === 'function' && typeof AudioWorkletNode === 'function';

export class WebAudioSink extends AudioSink {
  type: 'webaudio' = 'webaudio';
  local: true = true;
  private workletNode: AudioWorkletNode;
  private context: AudioContext;
  private cleanAudioContext: () => void;
  audioClockDriftHistory = new NumericStatsTracker<number>((v) => v, AUDIO_DRIFT_HISTORY_DURATION / AUDIO_DRIFT_HISTORY_INTERVAL);
  private audioBufferTransformer: DriftAwareAudioBufferTransformer;
  private audioVolumeDisabled = false;
  private volumeNode: GainNode;
  // will only be used if SharedArrayBuffer is supported by the browser
  private sharedAudioBuffer: SharedArrayBuffer;
  private sharedCircularAudioBuffer: CircularTypedArray<Float32Array>;

  constructor(descriptor: WebAudioSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.available = isWebAudioAvailable();

    if (!isBrowser) {
      throw new Error('WebAudio sink can only be created on a browser');
    }
  }

  async _startSink(source: AudioSource) {
    if (this.workletNode) {
      throw new Error('Webaudio sink already started');
    }

    if (!this.context) {
      this.context = new AudioContext({
        sampleRate: OPUS_ENCODER_RATE,
        // We could use a higher latencyHint here to improve power consumption but because of
        // a chromium bug, a higher latencyHint lead to a really bad getOutputTimestamp accuracy
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1086005
        latencyHint: 0.01,
      });
    }
    this.volumeNode = this.context.createGain();
    this.volumeNode.gain.value = this.audioVolumeDisabled ? 1 : this.volume;
    const syncDeviceVolume = () => {
      this.volumeNode.gain.value = this.audioVolumeDisabled ? 1 : this.volume;
    };
    this.on('update', syncDeviceVolume);

    this.audioBufferTransformer = new DriftAwareAudioBufferTransformer(
      this.channels,
      // if latencyCorrection is >0 it means we need to send samples [latencyCorrection]ms early to compensate for the additionnal delay
      () => Math.floor(this.audioClockDriftHistory.mean()) + (this.latencyCorrection * (this.rate / 1000)),
    );

    const driftRegisterInterval = setInterval(this.registerDrift, AUDIO_DRIFT_HISTORY_INTERVAL);
    // this should be set before any await to make sure we have the clean method available if _stopSink is called between _startSink ends
    this.cleanAudioContext = () => {
      this.off('update', syncDeviceVolume);
      if (this.workletNode) {
        this.workletNode.disconnect();
      }
      delete this.workletNode;
      this.context.suspend();
      delete this.context;
      this.cleanAudioContext = undefined;
      this.audioClockDriftHistory.flush();
      delete this.sharedAudioBuffer;
      delete this.sharedCircularAudioBuffer;
      clearInterval(driftRegisterInterval);
    };

    // we cannot put this class in the global file scope as it will be created by the nodejs process
    // which will throw an error because AudioWorkletNode only exists browser side
    class RawPcmPlayerWorklet extends AudioWorkletNode {
      constructor(context) {
        super(context, 'rawPcmPlayerProcessor', {
          numberOfOutputs: 1,
          numberOfInputs: 0,
          outputChannelCount: [source.channels],
        });
      }
    }
    // eslint-disable-next-line
    const audioworkletPath = require('./audioworklets/webaudio_sink_processor.audioworklet.ts');
    await this.context.audioWorklet.addModule(audioworkletPath);
    this.workletNode = new RawPcmPlayerWorklet(this.context);
    this.workletNode.connect(this.volumeNode);
    this.volumeNode.connect(this.context.destination);

    if (typeof SharedArrayBuffer !== 'undefined') {
      this.sharedAudioBuffer = new SharedArrayBuffer(MAX_LATENCY * (OPUS_ENCODER_RATE / 1000) * this.channels);
      this.sharedCircularAudioBuffer = new CircularTypedArray(Float32Array, this.sharedAudioBuffer);
    }
    this.workletNode.port.postMessage({
      type: 'init',
      sharedAudioBuffer: this.sharedAudioBuffer,
    });

    this.context.resume();

    // The context can be blocked from starting because of new webaudio changes
    // we need to wait for a user input to start it
    if (this.context.state === 'suspended') {
      await new Promise((r) => {
        const resumeOnClick = async () => {
          await this.context.resume();
          document.removeEventListener('click', resumeOnClick);
          r();
        };
        document.addEventListener('click', resumeOnClick);
      });
    }
    await this.pipedSource.peer.waitForFirstTimeSync();
    this.updateInfo({
      latency: (this.context.outputLatency || this.context.baseLatency) * 1000,
    });
    // TODO: handle the source latency change
  }

  _stopSink = () => {
    if (this.cleanAudioContext) {
      this.cleanAudioContext();
    }
  }

  handleAudioChunk = (data: AudioChunkStreamOutput) => {
    if (!this.workletNode) {
      return;
    }
    const chunk = new Float32Array(data.chunk.buffer, data.chunk.byteOffset, data.chunk.byteLength / Float32Array.BYTES_PER_ELEMENT);
    const { bufferTimestamp, buffer } = this.audioBufferTransformer.transformChunk(chunk, (data.i * OPUS_ENCODER_CHUNK_SAMPLES_COUNT));
    if (this.sharedCircularAudioBuffer) {
      this.sharedCircularAudioBuffer.set(buffer, bufferTimestamp * this.channels);
    } else {
      this.workletNode.port.postMessage({
        type: 'chunk',
        chunk: buffer,
        timestamp: bufferTimestamp,
      }, [buffer.buffer]); // we transfer the buffer.buffer to the audio worklet to prevent a memory copy
    }
  }

  registerDrift = () => {
    const deviceTime = this.context.getOutputTimestamp().contextTime * 1000;
    if (deviceTime === 0) {
      // audio context is not started yet, could be because it's waiting for a user interaction to start
      return;
    }
    const streamTime = this.pipedSource.peer.getCurrentTime(true)
      - this.pipedSource.startedAt
      - this.pipedSource.latency;
    const audioClockDrift = (deviceTime - streamTime) * (this.rate / 1000);
    if (!Number.isNaN(audioClockDrift)) {
      this.audioClockDriftHistory.push(audioClockDrift);
    }
  }

  setWebaudioVolumeDisabled = (disabled = true) => {
    this.audioVolumeDisabled = disabled;
    if (this.volumeNode) {
      this.volumeNode.gain.value = this.audioVolumeDisabled ? 1 : this.volume;
    }
  }

  toDescriptor = (sanitizeForConfigSave = false): AudioInstance<WebAudioSinkDescriptor> => ({
    type: 'webaudio',
    name: this.name,
    uuid: this.uuid,
    pipedFrom: this.pipedFrom,
    volume: this.volume,
    latencyCorrection: this.latencyCorrection,

    ...(!sanitizeForConfigSave && {
      peerUuid: this.peerUuid,
      instanceUuid: this.instanceUuid,
      latency: this.latency,
      available: this.available,
      error: this.error,
    }),
  })
}
