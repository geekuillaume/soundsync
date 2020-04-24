import { getPeersManager } from '../../communication/peers_manager';
import { AudioSink } from './audio_sink';
import { SinkDescriptor } from './sink_type';

export class RemoteSink extends AudioSink {
  local: false = false;

  patch(descriptor: Partial<SinkDescriptor>) {
    getPeersManager().getPeerByUuid(this.peerUuid).sendControllerMessage({
      type: 'sinkPatch',
      sink: {
        uuid: this.uuid,
        instanceUuid: this.instanceUuid,
        ...descriptor,
      },
    });
  }

  _startSink() {}
  _stopSink() {}
  handleAudioChunk() {}
}
