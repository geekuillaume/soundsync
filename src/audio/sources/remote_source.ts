// import {Encoder} from 'node-opus';
import { AudioSource } from './audio_source';
import { hostname } from 'os';
import { RemoteSourceDescriptor, SourceType } from './source_type';
import { WebrtcPeer } from '../../communication/wrtc_peer';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';

export class RemoteSource extends AudioSource {
  remoteType: SourceType;

  constructor(descriptor: RemoteSourceDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.local = false;
    this.channels = descriptor.channels;
    this.remoteType = descriptor.remoteType;
  }

  async _getAudioEncodedStream() {
    if (!(this.peer instanceof WebrtcPeer)) {
      // this should never happens as a remote source should have a webrtc peer
      throw new Error('Peer of remote source is not a WebRTC Peer, this should never happen');
    }
    await this.peer.connect();
    const stream = await this.peer.createAudioSourceChannel(this.uuid);
    this.log(`Created audio channel with source peer`);
    return stream;
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
