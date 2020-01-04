import { Decorder } from 'node-opus';
import debug from 'debug';
import uuidv4 from 'uuid/v4';

import { AUDIO_SOURCE_SAMPLES_PER_SECOND, OPUS_ENCODER_RATE } from '../utils/constants';
import { SourceType } from './source_type';
import { AudioSource } from './audio_source';
import { SinkDescriptor, SinkType } from './sink_type';

// This is an abstract class that shouldn't be used directly but implemented by real audio sink
export abstract class AudioSink {
  name: string;
  type: SinkType;
  decoder: NodeJS.ReadWriteStream;
  rate: number;
  channels: number;
  frameSize: number;
  log: debug.Debugger;
  local: boolean;
  uuid: string;
  sourceStream: NodeJS.ReadStream;

  abstract _startBackend(source: AudioSource): Promise<void> | void;
  abstract _pipeDecoderToBackend(decoderStream: NodeJS.ReadableStream): void;
  abstract _unpipeDecoderToBackend(): void;

  constructor(descriptor: SinkDescriptor) {
    this.name = descriptor.name;
    this.type = descriptor.type;
    this.rate = OPUS_ENCODER_RATE;
    this.uuid = descriptor.uuid || uuidv4();
    this.channels = 2;
    this.frameSize = this.rate / AUDIO_SOURCE_SAMPLES_PER_SECOND; // number of samples in a frame, default to 10ms
    this.log = debug(`soundsync:audioSink:${this.name}`);
    this.log(`Created new audio sink`);
  }

  async start(source: AudioSource) {
    this.log(`Linking audio source ${source.name} (uuid ${source.uuid}) to sink`);
    this.sourceStream = await source.start();
    await this._startBackend(source);
    if (!this.decoder) {
      this.decoder = new Decorder(this.rate, this.channels, this.frameSize)
      this.sourceStream.pipe(this.decoder);
    }
    this._pipeDecoderToBackend(this.decoder);
  }

}
