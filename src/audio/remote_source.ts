import {Encoder} from 'node-opus';
import { AudioSource } from './audio_source';
import { hostname } from 'os';
import { RemoteSourceDescriptor } from './source_type';
import { WebrtcPeer } from '../communication/wrtc_peer';

export class RemoteSource extends AudioSource {
  constructor(descriptor: RemoteSourceDescriptor) {
    super(descriptor);
    this.local = false;
    this.channels = descriptor.channels;
  }

  async start(): Promise<NodeJS.ReadStream> {
    console.log('SHOULD CONTACT OTHER PEER HERE');
    if (!this.encoder) {
      this.encoder = new Encoder(this.rate, this.channels, this.frameSize)
    }
    return <NodeJS.ReadStream>this.encoder;
  }

  // @ts-ignore
  _startBackend() {
    return;
  }
}
