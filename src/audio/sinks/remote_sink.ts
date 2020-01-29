import {getWebrtcServer} from '../../communication/wrtc_server';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import { SinkType, SinkDescriptor } from './sink_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';

export class RemoteSink extends AudioSink {
  local: false = false;

  constructor(descriptor: SinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
  }

  patch(descriptor: Partial<SinkDescriptor>) {
    getWebrtcServer().getPeerByUuid(this.peerUuid).sendControllerMessage({
      type: 'sinkInfo',
      uuid: this.uuid,
      sinkType: this.type,
      channels: this.channels,
      latency: descriptor.latency || this.latency,
      name: descriptor.name || this.name,
    });
  }

  async linkSource(source: AudioSource) {
  }

  async unlinkSource() {
  }

  _startSink(source: AudioSource) {
  }
  _stopSink() {
  }
}
