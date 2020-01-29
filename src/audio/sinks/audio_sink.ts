import debug from 'debug';
import uuidv4 from 'uuid/v4';

import { OPUS_ENCODER_FRAME_SAMPLES_COUNT, OPUS_ENCODER_RATE, OPUS_ENCODER_SAMPLES_PER_SECONDS, OPUS_ENCODER_SAMPLES_DURATION } from '../../utils/constants';
import { AudioSource } from '../sources/audio_source';
import { SinkDescriptor, SinkType, BaseSinkDescriptor } from './sink_type';
import { Peer } from '../../communication/peer';
import { getLocalPeer } from '../../communication/local_peer';
import { createAudioDecodedStream } from '../opus_streams';
import { AudioChunkStreamOutput } from '../../utils/chunk_stream';
import { getCurrentSynchronizedTime } from '../../coordinator/timekeeper';
import { PassThrough } from 'stream';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';

// This is an abstract class that shouldn't be used directly but implemented by real audio sink
export abstract class AudioSink {
  manager: AudioSourcesSinksManager;
  name: string;
  type: SinkType;
  decoder: NodeJS.ReadWriteStream;
  rate: number;
  channels: number;
  log: debug.Debugger;
  local: boolean;
  uuid: string;
  sourceStream: PassThrough;
  decodedStream: NodeJS.ReadableStream;
  peerUuid: string;
  inputStream: NodeJS.ReadableStream;
  buffer: {[key: string]: Buffer};
  latency: number = 50;
  pipedSource?: AudioSource;

  abstract _startSink(source: AudioSource): Promise<void> | void;
  abstract _stopSink(): Promise<void> | void;

  constructor(descriptor: SinkDescriptor, manager: AudioSourcesSinksManager) {
    this.manager = manager;
    this.name = descriptor.name;
    this.type = descriptor.type;
    this.rate = OPUS_ENCODER_RATE;
    this.uuid = descriptor.uuid || uuidv4();
    this.peerUuid = descriptor.peerUuid || getLocalPeer().uuid;
    this.channels = 2;
    this.log = debug(`soundsync:audioSink:${this.uuid}`);
    this.log(`Created new audio sink`);
  }

  patch(descriptor: Partial<SinkDescriptor>) {
    return this.updateInfo(descriptor);
  }

  updateInfo(descriptor: Partial<SinkDescriptor>) {
    let hasChanged = false;
    Object.keys(descriptor).forEach(prop => {
      if (descriptor[prop] && this[prop] !== descriptor[prop]) {
        hasChanged = true;
        this[prop] = descriptor[prop];
      }
    });
    if (hasChanged) {
      this.manager.emit('sinkUpdate', this);
    }
  }

  async linkSource(source: AudioSource) {
    // TODO: handle pipe two sources to same sink
    if (this.pipedSource) {
      return;
    }
    this.log(`Linking audio source ${source.name} (uuid ${source.uuid}) to sink`);
    this.pipedSource = source;
    this.buffer = {};
    this.sourceStream = await this.pipedSource.start();
    this.decodedStream = createAudioDecodedStream(this.sourceStream, this.channels);
    await this._startSink(this.pipedSource);
    this.decodedStream.on('data', this.handleAudioChunk);
  }

  unlinkSource() {
    if (!this.sourceStream) {
      return;
    }
    this._stopSink();
    delete this.pipedSource;
    this.sourceStream.end();
    delete this.sourceStream;
    this.decodedStream.off('data', this.handleAudioChunk);
    delete this.decodedStream;
    this.buffer = {};
  }

  private handleAudioChunk = (chunk: AudioChunkStreamOutput) => {
    // TODO: handle removing previous non read chunks
    this.buffer[chunk.i] = chunk.chunk;
  }

  getAudioChunkAtDelayFromNow() {
    if (!this.pipedSource) {
      return null;
    }
    const synchronizedChunkTime = (getCurrentSynchronizedTime() - this.pipedSource.startedAt - this.pipedSource.latency) + this.latency;
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
    peerUuid: this.peerUuid,
    latency: this.latency,
  })

  toDescriptor: () => BaseSinkDescriptor = () => ({
    type: this.type,
    name: this.name,
    uuid: this.uuid,
    latency: this.latency,
  })
}
