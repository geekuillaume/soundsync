import {Encoder} from 'node-opus';
import debug from 'debug';
import uuidv4 from 'uuid/v4';

import { AUDIO_SOURCE_SAMPLES_PER_SECOND, OPUS_ENCODER_RATE } from '../utils/constants';
import { SourceDescriptor, SourceType } from './source_type';
import { Peer } from '../communication/peer';
import { localPeer } from '../communication/local_peer';

// This is an abstract class that shouldn't be used directly but implemented by real audio sources
export abstract class AudioSource {
  name: string;
  type: SourceType;
  encoder: NodeJS.ReadWriteStream;
  rate: number;
  channels: number;
  frameSize: number;
  log: debug.Debugger;
  local: boolean;
  uuid: string;
  peer: Peer;

  abstract _startBackend(): Promise<NodeJS.ReadableStream> | NodeJS.ReadableStream;

  constructor(descriptor: SourceDescriptor) {
    this.name = descriptor.name;
    this.type = descriptor.type;
    this.rate = OPUS_ENCODER_RATE;
    this.uuid = descriptor.uuid || uuidv4();
    this.peer = descriptor.peer || localPeer;
    this.channels = 2;
    this.frameSize = this.rate / AUDIO_SOURCE_SAMPLES_PER_SECOND; // number of samples in a frame, default to 10ms
    this.log = debug(`soundsync:audioSource:${this.uuid}`);
    this.log(`Created new audio source`);
  }

  async start(): Promise<NodeJS.ReadableStream> {
    this.log(`Starting audio source`);
    const sourceStream = await this._startBackend();
    // if (!this.encoder) {
    //   this.encoder = new Encoder(this.rate, this.channels, this.frameSize)
    // }
    // sourceStream.pipe(this.encoder);
    // return <NodeJS.ReadStream>this.encoder;
    return sourceStream;
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
