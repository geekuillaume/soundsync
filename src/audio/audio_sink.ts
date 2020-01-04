import { Decoder } from 'node-opus';
import debug from 'debug';
import uuidv4 from 'uuid/v4';

import { AUDIO_SOURCE_SAMPLES_PER_SECOND, OPUS_ENCODER_RATE } from '../utils/constants';
import { AudioSource } from './audio_source';
import { SinkDescriptor, SinkType } from './sink_type';
import { Peer } from '../communication/peer';
import { localPeer } from '../communication/local_peer';

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
  sourceStream: NodeJS.ReadableStream;
  peer: Peer;

  abstract _startSink(source: AudioSource): Promise<void> | void;
  abstract _pipeSourceStreamToSink(sourceStream: NodeJS.ReadableStream): void;
  abstract _unpipeSourceStreamToSink(): void;

  constructor(descriptor: SinkDescriptor) {
    this.name = descriptor.name;
    this.type = descriptor.type;
    this.rate = OPUS_ENCODER_RATE;
    this.uuid = descriptor.uuid || uuidv4();
    this.peer = descriptor.peer || localPeer;
    this.channels = 2;
    this.frameSize = this.rate / AUDIO_SOURCE_SAMPLES_PER_SECOND; // number of samples in a frame, default to 10ms
    this.log = debug(`soundsync:audioSink:${this.name}`);
    this.log(`Created new audio sink`);
  }

  async linkSource(source: AudioSource) {
    this.log(`Linking audio source ${source.name} (uuid ${source.uuid}) to sink`);
    this.sourceStream = await source.start();
    await this._startSink(source);
    // if (!this.decoder) {
    //   this.decoder = new Decoder(this.rate, this.channels, this.frameSize)
    //   this.sourceStream.pipe(this.decoder);
    // }
    this._pipeSourceStreamToSink(this.sourceStream);
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
