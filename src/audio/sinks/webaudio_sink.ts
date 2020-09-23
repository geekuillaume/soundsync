// This is only used in a browser context

import debug from 'debug';
import { AudioChunkStreamOutput } from '../../utils/audio/chunk_stream';
import { isBrowser } from '../../utils/environment/isBrowser';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import { WebAudioSinkDescriptor } from './sink_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { AudioInstance } from '../utils';
import { OPUS_ENCODER_RATE } from '../../utils/constants';
import { NumericStatsTracker } from '../../utils/basicNumericStatsTracker';

const AUDIO_DRIFT_HISTORY_INTERVAL = 50;
const AUDIO_DRIFT_HISTORY_DURATION = 2 * 60 * 1000;

export class WebAudioSink extends AudioSink {
  type: 'webaudio' = 'webaudio';
  local: true = true;
  workletNode: AudioWorkletNode;
  context: AudioContext;
  cleanAudioContext;
  audioClockDriftHistory = new NumericStatsTracker<number>((v) => v, AUDIO_DRIFT_HISTORY_DURATION / AUDIO_DRIFT_HISTORY_INTERVAL);

  constructor(descriptor: WebAudioSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.available = typeof AudioContext === 'function' && typeof AudioWorkletNode === 'function';

    if (!isBrowser) {
      throw new Error('WebAudio sink can only be created on a browser');
    }
  }

  async _startSink(source: AudioSource) {
    if (this.workletNode) {
      throw new Error('Webaudio sink already started');
    }

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

    if (!this.context) {
      this.context = new AudioContext({
        sampleRate: OPUS_ENCODER_RATE,
        // We could use a higher latencyHint here to improve power consumption but because of
        // a chromium bug, a higher latencyHint lead to a really bad getOutputTimestamp accuracy
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1086005
        latencyHint: 0.01,
      });
    }
    // eslint-disable-next-line
    const audioworkletPath = require('./audioworklets/webaudio_sink_processor.audioworklet.ts');
    await this.context.audioWorklet.addModule(audioworkletPath);
    this.workletNode = new RawPcmPlayerWorklet(this.context);
    this.workletNode.port.postMessage({
      type: 'init',
      debug: debug.enabled('soundsync:audioSinkDebug'),
    });
    const volumeNode = this.context.createGain();
    volumeNode.gain.value = this.volume;
    this.workletNode.connect(volumeNode);
    volumeNode.connect(this.context.destination);

    this.context.resume();

    const syncDeviceVolume = () => {
      volumeNode.gain.value = this.volume;
    };
    this.on('update', syncDeviceVolume);
    const driftRegisterInterval = setInterval(this.registerDrift, AUDIO_DRIFT_HISTORY_INTERVAL);
    // this should be set before any await to make sure we have the clean method available if _stopSink is called between _startSink ends
    this.cleanAudioContext = () => {
      this.off('update', syncDeviceVolume);
      this.workletNode.disconnect();
      delete this.workletNode;
      this.context.suspend();
      delete this.context;
      this.cleanAudioContext = undefined;
      clearInterval(driftRegisterInterval);
    };

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
    this.workletNode.port.postMessage({
      type: 'chunk',
      i: data.i,
      chunk,
      audioClockDrift: this.audioClockDriftHistory.full(1) ? this.audioClockDriftHistory.mean() : -1,
    }, [chunk.buffer]); // we transfer the chunk.buffer to the audio worklet to prevent a memory copy
  }

  registerDrift = () => {
    const contextTime = this.context.getOutputTimestamp().contextTime;
    if (contextTime === 0) {
      // audio context is not started yet, could be because it's waiting for a user interaction to start
      return;
    }
    const audioClockDrift = ((
      this.pipedSource.peer.getCurrentTime(true)
        - this.pipedSource.startedAt
        - this.pipedSource.latency
        + this.latencyCorrection
    ) - (contextTime * 1000)) * (this.rate / 1000);
    if (!Number.isNaN(audioClockDrift)) {
      this.audioClockDriftHistory.push(audioClockDrift);
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
