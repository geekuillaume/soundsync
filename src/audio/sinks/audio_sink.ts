import debug from 'debug';
import uuidv4 from 'uuid/v4';

import { PassThrough } from 'stream';
import eos from 'end-of-stream';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_DURATION } from '../../utils/constants';
import { AudioSource } from '../sources/audio_source';
import {
  SinkDescriptor, SinkType, BaseSinkDescriptor, SinkInstanceDescriptor,
} from './sink_type';
import { createAudioDecodedStream } from '../opus_streams';
import { AudioChunkStreamOutput } from '../../utils/chunk_stream';
import { getCurrentSynchronizedTime } from '../../coordinator/timekeeper';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { getWebrtcServer } from '../../communication/wrtc_server';

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
  decodedStream: ReturnType<typeof createAudioDecodedStream>;
  peerUuid: string;
  instanceUuid = uuidv4(); // this is an id only for this specific instance, not saved between restart it is used to prevent a sink or source info being overwritten by a previous instance of the same sink/source
  inputStream: NodeJS.ReadableStream;
  buffer: {[key: string]: Buffer};
  latency = 50;
  pipedSource?: AudioSource;

  abstract _startSink(source: AudioSource): Promise<void> | void;
  abstract _stopSink(): Promise<void> | void;

  constructor(descriptor: SinkDescriptor, manager: AudioSourcesSinksManager) {
    this.manager = manager;
    this.name = descriptor.name;
    this.type = descriptor.type;
    this.rate = OPUS_ENCODER_RATE;
    this.uuid = descriptor.uuid || uuidv4();
    this.peerUuid = descriptor.peerUuid;
    this.channels = 2;
    this.log = debug(`soundsync:audioSink:${this.uuid}`);
    this.log(`Created new audio sink of type ${descriptor.type}`);
  }

  get peer() {
    return getWebrtcServer().peers[this.peerUuid];
  }

  patch(descriptor: Partial<SinkDescriptor>) {
    return this.updateInfo(descriptor);
  }

  updateInfo(descriptor: Partial<SinkInstanceDescriptor>) {
    if (this.local && descriptor.instanceUuid && descriptor.instanceUuid !== this.instanceUuid) {
      this.log('Received update for a different instance of the sink, ignoring (can be because of a restart of the client or a duplicated config on two clients)');
      return;
    }
    let hasChanged = false;
    Object.keys(descriptor).forEach((prop) => {
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
    try {
      await this._startSink(this.pipedSource);
    } catch (e) {
      this.decodedStream.destroy();
      this.log(`Error while starting sink`, e);
    }
    this.decodedStream.on('data', this.handleAudioChunk);
    eos(this.sourceStream, () => {
      this.log('Source stream has closed, unlinking');
      this.unlinkSource();
    });
  }

  unlinkSource() {
    if (!this.sourceStream) {
      return;
    }
    this._stopSink();
    delete this.pipedSource;
    this.sourceStream.destroy();
    delete this.sourceStream;
    this.decodedStream.off('data', this.handleAudioChunk);
    this.decodedStream.destroy();
    delete this.decodedStream;
    this.buffer = {};
  }

  handleAudioChunk = (chunk: AudioChunkStreamOutput) => {
    // TODO: handle removing previous non read chunks
    this.buffer[chunk.i] = chunk.chunk;
  }

  getAudioChunkAtDelayFromNow() {
    if (!this.pipedSource) {
      return null;
    }
    const synchronizedChunkTime = (getCurrentSynchronizedTime() - this.pipedSource.startedAt - this.pipedSource.latency) + this.latency;
    const correspondingChunkIndex = Math.floor(synchronizedChunkTime / OPUS_ENCODER_CHUNK_DURATION);
    const chunk = this.buffer[correspondingChunkIndex];
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
    peerUuid: this.peerUuid,
  })
}
