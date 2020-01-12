import debug from 'debug';
import uuidv4 from 'uuid/v4';

import { SourceDescriptor, SourceType } from './source_type';
import { Peer } from '../communication/peer';
import { localPeer } from '../communication/local_peer';
import { createAudioEncodedStream } from './opus_streams';

// This is an abstract class that shouldn't be used directly but implemented by real audio sources
export abstract class AudioSource {
  name: string;
  type: SourceType;
  rate: number = 0;
  channels: number;
  log: debug.Debugger;
  local: boolean;
  uuid: string;
  peer: Peer;

  abstract _startBackend(): Promise<NodeJS.ReadableStream> | NodeJS.ReadableStream;

  constructor(descriptor: SourceDescriptor) {
    this.name = descriptor.name;
    this.type = descriptor.type;
    this.uuid = descriptor.uuid || uuidv4();
    this.peer = descriptor.peer || localPeer;
    this.channels = 2;
    this.log = debug(`soundsync:audioSource:${this.uuid}`);
    this.log(`Created new audio source`);
  }

  async start(): Promise<NodeJS.ReadableStream> {
    this.log(`Starting audio source`);
    const sourceStream = await this._startBackend();
    return createAudioEncodedStream(sourceStream, this.rate, this.channels);
  }

  toObject = () => ({
    name: this.name,
    uuid: this.uuid,
    type: this.type,
    channels: this.channels,
    rate: this.rate,
    peerUuid: this.peer.uuid,
  })
}
