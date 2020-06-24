// This is only used in a browser context

import { AudioChunkStreamOutput } from '../../utils/chunk_stream';
import { isBrowser } from '../../utils/isBrowser';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import { WebAudioSinkDescriptor } from './sink_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { AudioInstance } from '../utils';
import { OPUS_ENCODER_RATE } from '../../utils/constants';

export class WebAudioSink extends AudioSink {
  type: 'webaudio' = 'webaudio';
  local: true = true;
  workletNode: AudioWorkletNode;
  context: AudioContext;
  cleanAudioContext;

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
        latencyHint: 0,
      });
    }
    // eslint-disable-next-line
    const audioworkletPath = require('./audioworklets/webaudio_sink_processor.audioworklet.ts');
    await this.context.audioWorklet.addModule(audioworkletPath);
    this.workletNode = new RawPcmPlayerWorklet(this.context);
    const volumeNode = this.context.createGain();
    volumeNode.gain.value = this.volume;
    this.workletNode.connect(volumeNode);
    volumeNode.connect(this.context.destination);

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
      latency: this.context.baseLatency * 1000,
    });
    this._synchronizeWorklet();

    const syncDeviceVolume = () => {
      volumeNode.gain.value = this.volume;
    };
    this.on('update', syncDeviceVolume);
    const resyncInterval = setInterval(this._synchronizeWorklet, 5000);
    // TODO: handle the source latency change
    this.cleanAudioContext = () => {
      this.off('update', syncDeviceVolume);
      clearInterval(resyncInterval);
      this.workletNode.disconnect();
      delete this.workletNode;
      this.context.suspend();
      delete this.context;
      this.cleanAudioContext = undefined;
    };
  }

  _synchronizeWorklet = () => {
    if (!this.workletNode) {
      return;
    }
    const currentStreamTime = this.getCurrentStreamTime();
    this.workletNode.parameters.get('streamTime').setValueAtTime(currentStreamTime + 200, this.context.getOutputTimestamp().contextTime + 0.2);
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
    const chunk = new Float32Array(data.chunk.buffer);
    this.workletNode.port.postMessage({
      type: 'chunk',
      i: data.i,
      chunk,
    }, [chunk.buffer]); // we transfer the chunk.buffer to the audio worklet to prevent a memory copy
  }

  toDescriptor = (sanitizeForConfigSave = false): AudioInstance<WebAudioSinkDescriptor> => ({
    type: 'webaudio',
    name: this.name,
    uuid: this.uuid,
    pipedFrom: this.pipedFrom,
    volume: this.volume,
    ...(!sanitizeForConfigSave && {
      peerUuid: this.peerUuid,
      instanceUuid: this.instanceUuid,
      latency: this.latency,
      available: this.available,
    }),
  })
}
