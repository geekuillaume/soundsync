import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import { RemoteSinkDescriptor, SinkType, SinkDescriptor } from './sink_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';

export class RemoteSink extends AudioSink {
  type: 'remote' = 'remote';
  local: false = false;
  remoteType: SinkType;

  constructor(descriptor: RemoteSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.remoteType = descriptor.remoteType;
  }

  async linkSource(source: AudioSource) {
    this.peer.sendControllerMessage({
      type: 'createPipe',
      sourceUuid: source.uuid,
      sinkUuid: this.uuid,
    });
  }

  async unlinkSource() {
    this.peer.sendControllerMessage({
      type: 'removePipe',
      sinkUuid: this.uuid,
    });
  }

  _startSink(source: AudioSource) {
  }
  _stopSink() {
  }

  toObject = () => ({
    name: this.name,
    uuid: this.uuid,
    type: this.remoteType,
    channels: this.channels,
    rate: this.rate,
    peerUuid: this.peer.uuid,
    latency: this.latency,
  })
}
