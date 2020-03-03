import debug from 'debug';
import uuidv4 from 'uuid/v4';

import { PassThrough } from 'stream';
import eos from 'end-of-stream';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_DURATION } from '../../utils/constants';
import { AudioSource } from '../sources/audio_source';
import {
  SinkDescriptor, SinkType, BaseSinkDescriptor, SinkUUID,
} from './sink_type';
import { createAudioDecodedStream } from '../opus_streams';
import { AudioChunkStreamOutput } from '../../utils/chunk_stream';
import { getCurrentSynchronizedTime } from '../../coordinator/timekeeper';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { getPeersManager } from '../../communication/peers_manager';
import { SourceUUID } from '../sources/source_type';
import { AudioInstance, MaybeAudioInstance } from '../utils';

// This is an abstract class that shouldn't be used directly but implemented by real audio sink
export abstract class AudioSink {
  uuid: SinkUUID;
  name: string;
  type: SinkType;
  rate: number;
  channels: number;
  local: boolean;
  peerUuid: string;
  pipedFrom?: SourceUUID;
  pipedSource?: AudioSource;

  manager: AudioSourcesSinksManager;
  decoder: NodeJS.ReadWriteStream;
  log: debug.Debugger;
  sourceStream: PassThrough;
  decodedStream: ReturnType<typeof createAudioDecodedStream>;
  instanceUuid ; // this is an id only for this specific instance, not saved between restart it is used to prevent a sink or source info being overwritten by a previous instance of the same sink/source
  inputStream: NodeJS.ReadableStream;
  buffer: {[key: string]: Buffer};
  latency = 50;

  abstract _startSink(source: AudioSource): Promise<void> | void;
  abstract _stopSink(): Promise<void> | void;

  constructor(descriptor: MaybeAudioInstance<SinkDescriptor>, manager: AudioSourcesSinksManager) {
    this.manager = manager;
    this.name = descriptor.name;
    this.type = descriptor.type;
    this.rate = OPUS_ENCODER_RATE;
    this.uuid = descriptor.uuid || uuidv4();
    this.peerUuid = descriptor.peerUuid;
    this.channels = 2;
    this.instanceUuid = descriptor.instanceUuid || uuidv4();
    this.log = debug(`soundsync:audioSink:${this.uuid}`);
    this.log(`Created new audio sink of type ${descriptor.type}`);
    this.manager.on('soundstateUpdated', this._syncPipeState);
  }

  get peer() {
    return getPeersManager().peers[this.peerUuid];
  }

  patch(descriptor: Partial<SinkDescriptor>) {
    return this.updateInfo(descriptor);
  }

  updateInfo(descriptor: Partial<AudioInstance<SinkDescriptor>>) {
    if (this.local && descriptor.instanceUuid && descriptor.instanceUuid !== this.instanceUuid) {
      this.log('Received update for a different instance of the sink, ignoring (can be because of a restart of the client or a duplicated config on two clients)');
      return;
    }
    let hasChanged = false;
    Object.keys(descriptor).forEach((prop) => {
      if (descriptor[prop] !== undefined && this[prop] !== descriptor[prop]) {
        hasChanged = true;
        this[prop] = descriptor[prop];
      }
    });
    if (hasChanged) {
      this.manager.emit('sinkUpdate', this);
      this.manager.emit('soundstateUpdated');
    }
  }

  // this get executed everytime there is a change in the sources/sinks
  private _syncPipeState = async () => {
    if (!this.local) {
      return;
    }
    const sourceToPipeFrom = this.pipedFrom && this.manager.getSourceByUuid(this.pipedFrom);
    if (!sourceToPipeFrom) {
      // should not be piped from something, unlinking if it is
      this.unlinkSource();
      return;
    }

    if (this.pipedSource && sourceToPipeFrom !== this.pipedSource) {
      // already piped but to the wrong source
      this.unlinkSource();
    }

    if (this.pipedSource && sourceToPipeFrom === this.pipedSource) {
      // nothing to do
      return;
    }

    this.buffer = {};
    // this.pipedSource should be set before any "await" to prevent a race condition if _syncPipeState
    // is called multiple times before this.pipedSource.start() has finished
    this.pipedSource = sourceToPipeFrom;
    this.log(`Linking audio source ${this.pipedSource.name} (uuid ${this.pipedSource.uuid}) to sink`);
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
    if (!this.pipedFrom) {
      return null;
    }
    const source = this.manager.getSourceByUuid(this.pipedFrom);
    if (!source) {
      return null;
    }
    const synchronizedChunkTime = (getCurrentSynchronizedTime() - source.startedAt - source.latency) + this.latency;
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

  toDescriptor: () => AudioInstance<BaseSinkDescriptor> = () => ({
    type: this.type,
    name: this.name,
    uuid: this.uuid,
    latency: this.latency,
    peerUuid: this.peerUuid,
    instanceUuid: this.instanceUuid,
    pipedFrom: this.pipedFrom,
  })
}
