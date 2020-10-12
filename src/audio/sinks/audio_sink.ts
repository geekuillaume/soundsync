import debug from 'debug';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

import { EventEmitter } from 'events';
import MiniPass from 'minipass';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_DURATION } from '../../utils/constants';
import { AudioSource } from '../sources/audio_source';
import {
  SinkDescriptor, SinkType, BaseSinkDescriptor, SinkUUID,
} from './sink_type';
import { AudioChunkStreamOutput } from '../../utils/audio/chunk_stream';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { getPeersManager } from '../../communication/get_peers_manager';
import { SourceUUID } from '../sources/source_type';
import { AudioInstance, MaybeAudioInstance } from '../utils';
import { AUDIO_SINK_EVENT_INTERVAL, captureEvent } from '../../utils/vendor_integrations/posthog';

// This is an abstract class that shouldn't be used directly but implemented by real audio sink
export abstract class AudioSink extends EventEmitter {
  uuid: SinkUUID;
  name: string;
  type: SinkType;
  rate: number;
  channels: number;
  local: boolean;
  peerUuid: string;
  pipedFrom?: SourceUUID;
  available: boolean;
  volume: number;
  latency = 0;
  instanceUuid: string; // this is an id only for this specific instance, not saved between restart it is used to prevent a sink or source info being overwritten by a previous instance of the same sink/source
  error?: string;
  latencyCorrection: number;

  protected pipedSource?: AudioSource;
  protected log: debug.Debugger;

  private manager: AudioSourcesSinksManager;
  private sourceStream: MiniPass; // stream returned asynchronously by the audio source
  protected lastReceivedChunkIndex = -1;

  abstract _startSink(source: AudioSource): Promise<void> | void;
  abstract _stopSink(): Promise<void> | void;

  constructor(descriptor: MaybeAudioInstance<SinkDescriptor>, manager: AudioSourcesSinksManager) {
    super();
    this.manager = manager;
    this.name = descriptor.name;
    this.type = descriptor.type;
    this.rate = OPUS_ENCODER_RATE;
    this.uuid = descriptor.uuid || uuidv4();
    this.peerUuid = descriptor.peerUuid;
    this.pipedFrom = descriptor.pipedFrom;
    this.available = descriptor.available ?? true;
    this.volume = descriptor.volume ?? 1;
    this.error = descriptor.error;
    this.latencyCorrection = descriptor.latencyCorrection || 0;
    this.channels = 2;
    this.instanceUuid = descriptor.instanceUuid || uuidv4();
    this.latency = descriptor.latency ?? 0;
    this.log = debug(`soundsync:audioSink:${this.uuid}`);
    this.log(`Created new audio sink of type ${descriptor.type}`);
    this.manager.on('soundstateUpdated', this._syncPipeState);
    getPeersManager().on('peerChange', this._syncPipeState);
    this._syncPipeState();
  }

  get peer() {
    return getPeersManager().getConnectedPeerByUuid(this.peerUuid);
  }

  patch(descriptor: Partial<SinkDescriptor>) {
    return this.updateInfo(descriptor);
  }

  on: (type: 'update', listener: (...args: any[]) => void) => this;
  emit: (type: 'update', ...args: any[]) => boolean;

  updateInfo(descriptor: Partial<AudioInstance<SinkDescriptor>>) {
    if (this.local && descriptor.instanceUuid && descriptor.instanceUuid !== this.instanceUuid) {
      this.log('Received update for a different instance of the sink, ignoring (can be because of a restart of the client or a duplicated config on two clients)');
      return;
    }
    let hasChanged = false;
    Object.keys(descriptor).forEach((prop) => {
      if (descriptor[prop] !== undefined && !_.isEqual(this[prop], descriptor[prop])) {
        hasChanged = true;
        this[prop] = descriptor[prop];
      }
    });
    if (hasChanged) {
      this.manager.emit('sinkUpdate', this);
      this.manager.emit('soundstateUpdated');
      this.emit('update');
      if (this.local) {
        this.manager.emit('localSoundStateUpdated');
      }
    }
  }

  // this get executed everytime there is a change in the sources/sinks
  private _syncPipeState = async () => {
    if (!this.local) {
      return;
    }
    const sourceToPipeFrom = this.pipedFrom && this.manager.getSourceByUuid(this.pipedFrom);
    if (
      !sourceToPipeFrom
      || !this.available
      || !sourceToPipeFrom.available
      || !sourceToPipeFrom.peer
      || sourceToPipeFrom.peer.state !== 'connected'
    ) {
      // should not be piped from something, unlinking if it is
      this.unlinkSource();
      return;
    }

    if (this.pipedSource && sourceToPipeFrom !== this.pipedSource) {
      // already piped but to the wrong source
      this.unlinkSource();
    }

    if (sourceToPipeFrom.active === false) {
      this.unlinkSource();
      if (!sourceToPipeFrom.started) {
        // if the source is not running, it will be inactive by default so we need to start it to check if it is active or not
        sourceToPipeFrom.peer.sendRcp('startSource', sourceToPipeFrom.uuid);
      }
      return;
    }

    if (this.pipedSource && sourceToPipeFrom === this.pipedSource) {
      // nothing to do
      return;
    }

    // this.pipedSource should be set before any "await" to prevent a race condition if _syncPipeState
    // is called multiple times before this.pipedSource.start() has finished
    this.pipedSource = sourceToPipeFrom;
    this.log(`Linking audio source ${this.pipedSource.name} (uuid ${this.pipedSource.uuid}) to sink`);

    const sourceStream = await this.pipedSource.createAudioStream();
    if (this.pipedSource !== sourceToPipeFrom) {
      // used to prevent race condition if pipedSource is changed during the time we are waiting for the sourceStream to be returned
      sourceStream.end();
      return;
    }
    this.sourceStream = sourceStream;
    this.sourceStream.on('end', () => {
      this.log('Source stream has closed, unlinking');
      this.unlinkSource();
    });
    this.sourceStream.on('data', this._handleAudioChunk);

    try {
      await this._startSink(this.pipedSource);
    } catch (e) {
      this.log(`Error while starting sink`, e);
      this.updateInfo({
        error: e.toString(),
      });
      return;
    }
    if (this.error) {
      this.updateInfo({ error: null });
    }
  }

  unlinkSource() {
    if (this.error) {
      this.updateInfo({ error: null });
    }
    if (!this.pipedSource) {
      return;
    }
    this._stopSink();
    if (this.sourceStream) {
      this.sourceStream.end();
    }
    delete this.sourceStream;
    // we should delete this.pipedSource at the end of this method because this._stopSink can still rely on it
    delete this.pipedSource;
    this.lastReceivedChunkIndex = -1;
  }

  _handleAudioChunk = (chunk: AudioChunkStreamOutput) => {
    const timeDelta = this.pipedSource.peer.getCurrentTime() - (chunk.i * OPUS_ENCODER_CHUNK_DURATION + this.pipedSource.startedAt);
    if (timeDelta > this.pipedSource.latency) {
      this.log(`Received old chunk, discarding it: ${chunk.i}, current playing chunk is ${Math.floor((this.pipedSource.peer.getCurrentTime() - this.pipedSource.startedAt) / OPUS_ENCODER_CHUNK_DURATION)}`);
      // we received old chunks, discard them
      return;
    }
    const outOfOrder = this.lastReceivedChunkIndex === -1 || chunk.i !== this.lastReceivedChunkIndex + 1;
    if (outOfOrder && this.lastReceivedChunkIndex !== -1) {
      this.log(`Received out-of-order chunk, received chunk index: ${chunk.i}, last chunk index: ${this.lastReceivedChunkIndex}`);
    }

    this.handleAudioChunk(chunk, outOfOrder);
    // we should update lastReceivedChunkIndex after handleAudioChunk to let the sink implementation use this info
    this.lastReceivedChunkIndex = chunk.i;
    if ((chunk.i * OPUS_ENCODER_CHUNK_DURATION) % AUDIO_SINK_EVENT_INTERVAL === 0 && chunk.i !== 0) {
      captureEvent('Audio sink 10 minutes', {
        type: this.type,
        localSource: this.pipedSource.local,
      });
    }
  }

  abstract handleAudioChunk(chunk: AudioChunkStreamOutput, outOfOrder: boolean);

  getCurrentStreamTime = () => this.pipedSource.peer.getCurrentTime()
      - this.pipedSource.startedAt
      - this.pipedSource.latency
      + this.latency + this.latencyCorrection

  toDescriptor = (sanitizeForConfigSave = false): AudioInstance<BaseSinkDescriptor> => ({
    type: this.type,
    name: this.name,
    uuid: this.uuid,
    pipedFrom: this.pipedFrom,
    volume: this.volume,
    latencyCorrection: this.latencyCorrection,

    ...(!sanitizeForConfigSave && {
      available: this.available,
      instanceUuid: this.instanceUuid,
      latency: this.latency,
      peerUuid: this.peerUuid,
      error: this.error,
    }),
  })
}
