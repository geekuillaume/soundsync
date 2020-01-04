import { AudioSource } from './audio_source';
import { hostname } from 'os';
import { RemoteSourceDescriptor } from './source_type';
import { WebrtcPeer } from '../communication/wrtc_peer';

export class RemoteSource extends AudioSource {
  peer: WebrtcPeer;

  constructor(descriptor: RemoteSourceDescriptor) {
    super(descriptor);
    this.local = false;
    this.channels = descriptor.channels;
    if (descriptor.peer) {
      this.peer = descriptor.peer;
    }
  }

  _startBackend() {
  }

  _pipeBackendToEncoder(encoderStream: NodeJS.WritableStream) {
    // this.log(`Piping to encoder`);
    // this.encoderStream = encoderStream;
    // this.librespotProcess.stdout.pipe(encoderStream);
  }

  _unpipeBackendToEncoder() {
    // if (this.encoderStream) {
    //   this.log(`Unpiping encoder`);
    //   this.librespotProcess.stdout.unpipe(this.encoderStream);
    //   this.encoderStream = null;
    // }
  }

}
