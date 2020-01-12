// import {Encoder} from 'node-opus';
import { AudioSource } from './audio_source';
import { hostname } from 'os';
import { RemoteSourceDescriptor } from './source_type';
import { WebrtcPeer } from '../../communication/wrtc_peer';

export class RemoteSource extends AudioSource {
  constructor(descriptor: RemoteSourceDescriptor) {
    super(descriptor);
    this.local = false;
    this.channels = descriptor.channels;
  }

  async start() {
    if (!(this.peer instanceof WebrtcPeer)) {
      // this should never happens as a remote source should have a webrtc peer
      return;
    }
    await this.peer.connect();
    const stream = await this.peer.createAudioSourceChannel(this.uuid);
    return stream;
  }

  // @ts-ignore
  _startBackend() {
    return;
  }
}
