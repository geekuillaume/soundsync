import { AudioSink } from './audio_sink';
import { SinkDescriptor } from './sink_type';

export class RemoteSink extends AudioSink {
  local: false = false;

  patch(descriptor: Partial<SinkDescriptor>) {
    if (this.peer) {
      this.peer.sendControllerMessage({
        type: 'sinkPatch',
        sink: {
          uuid: this.uuid,
          instanceUuid: this.instanceUuid,
          ...descriptor,
        },
      });
    }
  }

  _startSink() {}
  _stopSink() {}
  handleAudioChunk() {}
}
