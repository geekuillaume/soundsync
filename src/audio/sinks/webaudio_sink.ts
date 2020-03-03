// This is only used in a browser context

import { AudioChunkStreamOutput } from '../../utils/chunk_stream';
import { isBrowser } from '../../utils/isBrowser';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import { WebAudioSinkDescriptor } from './sink_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { getCurrentSynchronizedTime } from '../../coordinator/timekeeper';
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
    await this.context.audioWorklet.addModule('/webaudio_sink_processor.audioworklet.js');
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
    // There is three clocks in game here, the coordinator clock, the webpage performance.now() clock
    // and the audio context clock. We use this method to get a common time origin to synchronize the
    // source chunks with the common play time
    this.workletNode.port.postMessage({
      type: 'sourceTimeAtAudioTimeOrigin',
      sourceTimeAtAudioTimeOrigin:
        // current time of the audio context in the coordinator time referential
        (getCurrentSynchronizedTime() - (this.context.currentTime * 1000))
        // minus the source time
        - (source.startedAt + source.latency),
    });
    // TODO: handle the source latency change
    // TODO: handle the webaudio latency from this.context.outputLatency
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
    const chunk = new Float32Array(data.chunk);
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
