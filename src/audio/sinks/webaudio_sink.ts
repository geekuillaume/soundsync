import { AudioChunkStreamOutput } from '../../utils/chunk_stream';
import { isBrowser } from '../../utils/isBrowser';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_SAMPLES_COUNT, OPUS_ENCODER_CHUNKS_PER_SECONDS } from '../../utils/constants';
import { WebAudioSinkDescriptor } from './sink_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { getCurrentSynchronizedTime } from '../../coordinator/timekeeper';

export class WebAudioSink extends AudioSink {
  type: 'webaudio' = 'webaudio';
  local: true = true;
  workletNode: AudioWorkletNode;

  constructor(descriptor: WebAudioSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    if (!isBrowser) {
      throw new Error('WebAudio sink can only be created on a browser');
    }
  }

  async _startSink(source: AudioSource) {
    class RawPcmPlayerWorklet extends AudioWorkletNode {
      constructor(context) {
        super(context, 'rawPcmPlayerProcessor', {
          numberOfOutputs: 1,
          numberOfInputs: 0,
          outputChannelCount: [source.channels],
        });
      }
    }

    const context = new AudioContext({
      sampleRate: 48000,
      // latencyHint: 'interactive',
    });
    // this is handled by parcel with the copy static files config
    await context.audioWorklet.addModule('/webaudio_sink_processor.audioworklet.js');
    this.workletNode = new RawPcmPlayerWorklet(context);
    this.workletNode.connect(context.destination);
    if (context.state === 'suspended') {
      await new Promise((r) => {
        const resumeOnClick = () => {
          context.resume();
          document.removeEventListener('click', resumeOnClick);
          r();
        };
        document.addEventListener('click', resumeOnClick);
      });
    }
    console.log('current time', getCurrentSynchronizedTime());
    console.log('context time', context.currentTime * 1000);
    console.log('source started at', source.startedAt);
    console.log('source latency', source.latency);

    this.workletNode.port.postMessage({
      type: 'sourceTimeAtAudioTimeOrigin',
      sourceTimeAtAudioTimeOrigin: (getCurrentSynchronizedTime() - (context.currentTime * 1000)) - (source.startedAt + source.latency),
    });
  }

  _stopSink() {
  }

  handleAudioChunk = (data: AudioChunkStreamOutput) => {
    if (!this.workletNode) {
      return;
    }
    // TODO: use transferable argument of postMessage
    this.workletNode.port.postMessage({
      type: 'chunk',
      i: data.i,
      chunk: new Float32Array(data.chunk),
    });
  }

  toDescriptor: (() => WebAudioSinkDescriptor) = () => ({
    type: 'webaudio',
    name: this.name,
    uuid: this.uuid,
    peerUuid: this.peerUuid,
  })
}
