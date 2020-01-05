import { AudioSink } from './audio_sink';
import { AudioSource } from './audio_source';
import { RemoteSinkDescriptor } from './sink_type';
import { WebrtcPeer } from '../communication/wrtc_peer';

export class RemoteSink extends AudioSink {
  type: 'remote' = 'remote';

  constructor(descriptor: RemoteSinkDescriptor) {
    super(descriptor);
    this.local = false;
  }

  async linkSource(source: AudioSource) {
    this.peer.sendControllerMessage({
      type: 'createPipe',
      sourceUuid: source.uuid,
      sinkUuid: this.uuid,
    });
  }
  _startSink(source: AudioSource) {
  }

  _pipeSourceStreamToSink(decoderStream: NodeJS.ReadableStream) {
  }

  _unpipeSourceStreamToSink() {
  }
}
