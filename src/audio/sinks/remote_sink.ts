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
        latency: descriptor.latency || this.latency,
        name: descriptor.name || this.name,
        pipedFrom: descriptor.pipedFrom !== undefined ? descriptor.pipedFrom : this.pipedFrom,
      },
    });
  }

  _startSink() {}
  _stopSink() {}
  handleAudioChunk() {}
}
