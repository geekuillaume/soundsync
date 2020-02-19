import { AudioSource } from './audio_source';
import { SourceDescriptor } from './source_type';
import { WebrtcPeer } from '../../communication/wrtc_peer';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { getWebrtcServer } from '../../communication/wrtc_server';

export class RemoteSource extends AudioSource {
  local: false = false;

  constructor(descriptor: SourceDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.channels = descriptor.channels;
  }

  patch(descriptor: Partial<SourceDescriptor>) {
    getWebrtcServer().getPeerByUuid(this.peerUuid).sendControllerMessage({
      type: 'sourceInfo',
      uuid: this.uuid,
      channels: this.channels,
      latency: this.latency,
      peerUuid: this.peerUuid,
      sourceType: this.type,
      startedAt: this.startedAt,
      name: descriptor.name || this.name,
      instanceUuid: this.instanceUuid,
    });
  }

  async _getAudioEncodedStream() {
    const peer = getWebrtcServer().getPeerByUuid(this.peerUuid);
    if (!(peer instanceof WebrtcPeer)) {
      // this should never happens as a remote source should have a webrtc peer
      throw new Error('Peer of remote source is not a WebRTC Peer, this should never happen');
    }
    await peer.connect();
    const stream = await peer.createAudioSourceChannel(this.uuid);
    this.log(`Created audio channel with source peer`);
    return stream;
  }

  handleNoMoreReadingSink() {
    const peer = this.peer;
    if (!(peer instanceof WebrtcPeer)) {
      // this should never happens as a remote source should have a webrtc peer
      throw new Error('Peer of remote source is not a WebRTC Peer, this should never happen');
    }
    peer.closeAudioSourceChanel(this.uuid);
    if (this.encodedAudioStream) {
      this.encodedAudioStream.destroy();
    }
    delete this.encodedAudioStream;
    delete this.directSourceStream;
  }
}
