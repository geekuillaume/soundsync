import debug from 'debug';
import uuidv4 from 'uuid/v4';

import { OPUS_ENCODER_FRAME_SAMPLES_COUNT, OPUS_ENCODER_RATE, OPUS_ENCODER_SAMPLES_PER_SECONDS, OPUS_ENCODER_SAMPLES_DURATION } from '../../utils/constants';
import { AudioSource } from '../sources/audio_source';
import { SinkDescriptor, SinkType } from './sink_type';
import { Peer } from '../../communication/peer';
import { localPeer } from '../../communication/local_peer';
import { createAudioDecodedStream } from '../opus_streams';
import { AudioChunkStreamOutput } from '../../utils/chunk_stream';
import { getCurrentSynchronizedTime } from '../../coordinator/timekeeper';

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
  inputStream: NodeJS.ReadableStream;
  buffer: {[key: string]: Buffer};
  pipedSource?: AudioSource;

  abstract _startSink(source: AudioSource): Promise<void> | void;
  abstract _stopSink(): Promise<void> | void;

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
    this.pipedSource = source;
    this.buffer = {};
    this.sourceStream = await this.pipedSource.start();
    const decodedStream = createAudioDecodedStream(this.sourceStream, this.channels);
    await this._startSink(this.pipedSource);
    decodedStream.on('data', this.handleAudioChunk);
  }

  private handleAudioChunk = (chunk: AudioChunkStreamOutput) => {
    // TODO: handle removing previous non read chunks
    this.buffer[chunk.i] = chunk.chunk;
  }

  getAudioChunkAtDelayFromNow(localDelay: number) {
    if (!this.pipedSource) {
      return null;
    }
    const synchronizedChunkTime = (getCurrentSynchronizedTime() - this.pipedSource.startedAt - this.pipedSource.latency) + localDelay;
    const correspondingChunkIndex = Math.floor(synchronizedChunkTime / OPUS_ENCODER_SAMPLES_DURATION);
    const chunk = this.buffer[correspondingChunkIndex]
    this.buffer[correspondingChunkIndex] = undefined;
    if (!chunk) {
      return null;
    }
    return chunk;
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
