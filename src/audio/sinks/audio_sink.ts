// import { Decoder } from 'node-opus';
import debug from 'debug';
import uuidv4 from 'uuid/v4';

import { OPUS_ENCODER_FRAME_SAMPLES_COUNT, OPUS_ENCODER_RATE } from '../../utils/constants';
import { AudioSource } from '../sources/audio_source';
import { SinkDescriptor, SinkType } from './sink_type';
import { Peer } from '../../communication/peer';
import { localPeer } from '../../communication/local_peer';
import { OpusDecodeStream, createAudioDecodedStream } from '../opus_streams';

// This is an abstract class that shouldn't be used directly but implemented by real audio sink
export abstract class AudioSink {
  name: string;
  type: SinkType;
  decoder: NodeJS.ReadWriteStream;
  rate: number;
  channels: number;
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
    this.log = debug(`soundsync:audioSink:${this.uuid}`);
    this.log(`Created new audio sink`);
  }

  async linkSource(source: AudioSource) {
    this.log(`Linking audio source ${source.name} (uuid ${source.uuid}) to sink`);
    this.sourceStream = await source.start();
    const decodedStream = createAudioDecodedStream(this.sourceStream, this.channels);
    await this._startSink(source);
    // TODO do not pipe to stream but read from source stored chunks to handle latency / sync
    this._pipeSourceStreamToSink(decodedStream);
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
