// This is only used in a browser context

import { AudioChunkStreamOutput } from '../../utils/chunk_stream';
import { isBrowser } from '../../utils/isBrowser';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import { WebAudioSinkDescriptor } from './sink_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { AudioInstance } from '../utils';

export class WebAudioSink extends AudioSink {
  type: 'webaudio' = 'webaudio';
  local: true = true;
  workletNode: AudioWorkletNode;
  context: AudioContext;

  constructor(descriptor: WebAudioSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
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
        sampleRate: 48000,
        latencyHint: 'interactive',
      });
    }
    // this is handled by parcel with the copy static files config
    // this file needs to be available at the root of the web server
    // eslint-disable-next-line
    const audioworkletPath = require('./audioworklets/webaudio_sink_processor.audioworklet.ts');
    await this.context.audioWorklet.addModule(audioworkletPath);
    this.workletNode = new RawPcmPlayerWorklet(this.context);
    this.workletNode.connect(this.context.destination);

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
    // Todo: use this.context.getOutputTimestamp() as time reference to prevent time shift between sending and receiving the message in the audio thread
    this.workletNode.port.postMessage({
      type: 'currentStreamTime',
      currentStreamTime: this.getCurrentStreamTime(),
    });
    // TODO: handle the source latency change
  }

  _stopSink() {
    this.context.suspend();
    this.workletNode.disconnect();
    delete this.workletNode;
  }

  handleAudioChunk = (data: AudioChunkStreamOutput) => {
    if (!this.workletNode) {
      return;
    }
    if ((data.i * 10 + this.pipedSource.startedAt) - this.pipedSource.peer.getCurrentTime() < -200) {
      // we received old chunks, discard them
      return;
    }
    const chunk = new Float32Array(data.chunk.buffer);
    this.workletNode.port.postMessage({
      type: 'chunk',
      i: data.i,
      chunk,
    }, [chunk.buffer]); // we transfer the chunk.buffer to the audio worklet to prevent a memory copy
  }

  toDescriptor: (() => AudioInstance<WebAudioSinkDescriptor>) = () => ({
    type: 'webaudio',
    name: this.name,
    uuid: this.uuid,
    peerUuid: this.peerUuid,
    instanceUuid: this.instanceUuid,
    pipedFrom: this.pipedFrom,
    latency: this.latency,
  })
}
