import { getWebrtcServer } from '../../communication/wrtc_server';
import { AudioSink } from './audio_sink';
import { SinkDescriptor } from './sink_type';

export class RemoteSink extends AudioSink {
  local: false = false;

  patch(descriptor: Partial<SinkDescriptor>) {
    getWebrtcServer().getPeerByUuid(this.peerUuid).sendControllerMessage({
      type: 'sinkInfo',
      uuid: this.uuid,
      sinkType: this.type,
      channels: this.channels,
      latency: descriptor.latency || this.latency,
      name: descriptor.name || this.name,
      instanceUuid: this.instanceUuid,
    });
  }

  _startSink() {
  }
  _stopSink() {
  }
}
