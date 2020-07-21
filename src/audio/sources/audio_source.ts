import debug from 'debug';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

import MiniPass from 'minipass';
import { createAudioEncodedStream } from '../../utils/audio/chunk_stream';
import { INACTIVE_TIMEOUT, SOURCE_MIN_LATENCY_DIFF_TO_RESYNC, LATENCY_MARGIN } from '../../utils/constants';
import {
  SourceDescriptor, SourceType, BaseSourceDescriptor,
} from './source_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { getPeersManager } from '../../communication/get_peers_manager';
import { AudioInstance, MaybeAudioInstance } from '../utils';
import { now } from '../../utils/misc';

const DEFAULT_LATENCY = 1000;

// This is an abstract class that shouldn't be used directly but implemented by real audio sources
export abstract class AudioSource {
  name: string;
  type: SourceType;
  rate = 0;
  channels: number;
  local: boolean;
  uuid: string;
  peerUuid: string;
  instanceUuid: string; // this is an id only for this specific instance, not saved between restart it is used to prevent a sink or source info being overwritten by a previous instance of the same sink/source
  startedAt: number;
  latency: number;
  available: boolean;
  started: boolean;
  active: boolean; // is source currently outputting sound or has been silent for INACTIVE_TIMEOUT ms

  // we separate the two streams so that we can synchronously create the encodedAudioStream which will be empty while the
  // real source initialize, this simplify the code needed to handle the source being started twice at the same time
  protected directSourceStream: MiniPass; // internal stream from the source
  protected sourceStream: MiniPass; // stream used to redistribute the audio chunks to every sink
  protected encodedSourceStream: ReturnType<typeof createAudioEncodedStream>; // encoded and compressed audio stream
  protected log: debug.Debugger;

  private consumersStreams: MiniPass[] = [];
  private encodedConsumersStreams: MiniPass[] = [];
  private manager: AudioSourcesSinksManager;

  protected abstract _getAudioChunkStream(): Promise<MiniPass> | MiniPass;

  constructor(descriptor: MaybeAudioInstance<SourceDescriptor>, manager: AudioSourcesSinksManager) {
    this.manager = manager;
    this.type = descriptor.type;
    this.uuid = descriptor.uuid || uuidv4();
    this.peerUuid = descriptor.peerUuid;
    this.name = descriptor.name;
    this.startedAt = descriptor.startedAt;
    this.latency = descriptor.latency || DEFAULT_LATENCY;
    this.channels = descriptor.channels || 2;
    this.instanceUuid = descriptor.instanceUuid || uuidv4();
    this.available = descriptor.available;
    this.active = descriptor.active ?? false; // true by default, will be set to false if there is not activity, this is necessary to allow the source to be started
    this.started = descriptor.started ?? false;
    this.log = debug(`soundsync:audioSource:${this.uuid}`);
    this.log(`Created new audio source`);
  }

  get peer() {
    return getPeersManager().getConnectedPeerByUuid(this.peerUuid);
  }

  // Change info about a source in response to a user event
  patch(descriptor: Partial<SourceDescriptor>) {
    return this.updateInfo(descriptor);
  }

  // Update source info in response to a controllerMessage
  updateInfo(descriptor: Partial<AudioInstance<SourceDescriptor>>) {
    if (this.local && descriptor.instanceUuid && descriptor.instanceUuid !== this.instanceUuid) {
      this.log('Received update for a different instance of the source, ignoring (can be because of a restart of the client or a duplicated config on two clients)');
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
      this.manager.emit('sourceUpdate', this);
      this.manager.emit('soundstateUpdated');
      if (this.local) {
        this.manager.emit('localSoundStateUpdated');
      }
    }
  }

  private setInactive = () => {
    this.updateInfo({ active: false });
  }

  startReading = async () => {
    if (!this.sourceStream) {
      this.log(`Starting audio source`);
      this.sourceStream = new MiniPass();
      this.updateInfo({ started: true });
      if (this.local) {
        this.updateInfo({ startedAt: Math.floor(now()) }); // no need for more than 1ms of precision
      }
      let inactiveTimeout: NodeJS.Timeout = null;
      // we don't use pipe here because minipass cannot be unpiped but we still need to stop sending to ended consumersStreams
      this.sourceStream.on('data', (d) => {
        if (this.local) {
          if (inactiveTimeout) {
            clearTimeout(inactiveTimeout);
            inactiveTimeout = null;
          }
          inactiveTimeout = setTimeout(this.setInactive, INACTIVE_TIMEOUT);
          if (!this.active) {
            this.updateInfo({ active: true });
          }
        }
        this.consumersStreams.forEach((stream) => stream.write(d));
        if (this.encodedConsumersStreams.length) {
          if (!this.encodedSourceStream) {
            // create the opus encoder only if needed to optimize memory usage
            this.initAudioEncodedStream();
          }
          this.encodedSourceStream.input.write(d);
        }
      });
      try {
        this.directSourceStream = await this._getAudioChunkStream();
        this.directSourceStream.on('finish', () => {
          this.log('Source stream finished, cleaning source');
          // when the readable stream finishes => when the source program exit / source file finishes
          if (this.sourceStream) {
            this.sourceStream.end();
          }
          delete this.sourceStream;
          delete this.directSourceStream;
        });
        this.directSourceStream.pipe(this.sourceStream);
      } catch (e) {
        this.log('Error while starting source', e);
      }
    }
  }

  private initAudioEncodedStream = () => {
    this.encodedSourceStream = createAudioEncodedStream(this.channels);
    this.encodedSourceStream.output.on('data', (d) => {
      this.encodedConsumersStreams.forEach((s) => s.write(d));
    });
  }

  async start(encodedForTransport = false): Promise<MiniPass> {
    await this.startReading();
    const instanceStream = new MiniPass();
    instanceStream.on('end', () => {
      if (encodedForTransport) {
        _.remove(this.encodedConsumersStreams, (s) => s === instanceStream);
      } else {
        _.remove(this.consumersStreams, (s) => s === instanceStream);
      }
      if (this.consumersStreams.length === 0 && this.encodedConsumersStreams.length === 0) {
        this.handleNoMoreReadingSink();
      }
    });
    if (encodedForTransport) {
      this.encodedConsumersStreams.push(instanceStream);
    } else {
      this.consumersStreams.push(instanceStream);
    }
    this.manager.on('soundstateUpdated', this.updateLatencyFromSinks);
    return instanceStream;
  }

  protected handleNoMoreReadingSink() {
    // by default do nothing
    // this keeps process like librespot running in the background
    // but can be changed by other sources like remote_source to stop receiving data
  }

  // can be reimplemented to do more cleaning on source delete
  protected _stop() {}

  stop() {
    if (this.sourceStream) {
      this.sourceStream.end();
    }
    delete this.sourceStream;
    delete this.directSourceStream;
    this.consumersStreams.forEach((consumerStream) => {
      consumerStream.end();
    });
    this.consumersStreams = [];
    this.manager.off('soundstateUpdated', this.updateLatencyFromSinks);
    this._stop();
  }

  private updateLatencyFromSinks = () => {
    const pipedSinks = this.manager.sinks.filter((s) => s.pipedFrom === this.uuid);
    if (!pipedSinks.length) {
      return;
    }
    const maxLatency = Math.max(...pipedSinks.map(({ latency }) => latency)) + LATENCY_MARGIN;
    if (maxLatency > this.latency || this.latency - maxLatency > SOURCE_MIN_LATENCY_DIFF_TO_RESYNC) {
      this.updateInfo({
        latency: maxLatency,
      });
    }
  }

  toObject = () => ({
    name: this.name,
    uuid: this.uuid,
    type: this.type,
    channels: this.channels,
    rate: this.rate,
    peerUuid: this.peerUuid,
    latency: this.latency,
    available: this.available,
  })

  toDescriptor = (sanitizeForConfigSave = false): AudioInstance<BaseSourceDescriptor> => ({
    name: this.name,
    uuid: this.uuid,
    type: this.type,
    channels: this.channels,

    ...(!sanitizeForConfigSave && {
      started: this.started,
      latency: this.latency,
      peerUuid: this.peerUuid,
      startedAt: this.startedAt,
      instanceUuid: this.instanceUuid,
      available: this.available,
      active: this.active,
    }),
  })
}
