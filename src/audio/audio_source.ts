import {Encoder} from 'node-opus';
import debug from 'debug';
import uuidv4 from 'uuid/v4';

import { AUDIO_SOURCE_SAMPLES_PER_SECOND, OPUS_ENCODER_RATE } from '../utils/constants';
import { SourceDescriptor, SourceType } from './source_type';

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

  abstract _startBackend(): Promise<void> | void;
  abstract _pipeBackendToEncoder(encoderStream: NodeJS.WritableStream): void;
  abstract _unpipeBackendToEncoder(): void;

  constructor(descriptor: SourceDescriptor) {
    this.name = descriptor.name;
    this.type = descriptor.type;
    this.rate = OPUS_ENCODER_RATE;
    this.uuid = descriptor.uuid || uuidv4();
    this.channels = 2;
    this.frameSize = this.rate / AUDIO_SOURCE_SAMPLES_PER_SECOND; // number of samples in a frame, default to 10ms
    this.log = debug(`soundsync:audioSource:${this.uuid}`);
    this.log(`Created new audio source`);
  }

  async start(): Promise<NodeJS.ReadStream> {
    this.log(`Starting audio source`);
    await this._startBackend();
    if (!this.encoder) {
      this.encoder = new Encoder(this.rate, this.channels, this.frameSize)
    }
    this._pipeBackendToEncoder(this.encoder);
    return <NodeJS.ReadStream>this.encoder;
  }

}
