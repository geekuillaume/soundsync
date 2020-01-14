import debug from 'debug';
import uuidv4 from 'uuid/v4';

import { SourceDescriptor, SourceType } from './source_type';
import { Peer } from '../../communication/peer';
import { localPeer } from '../../communication/local_peer';
import { getCurrentSynchronizedTime } from '../../coordinator/timekeeper';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';

// This is an abstract class that shouldn't be used directly but implemented by real audio sources
export abstract class AudioSource {
  name: string;
  type: SourceType;
  rate: number = 0;
  channels: number = 2;
  log: debug.Debugger;
  local: boolean;
  uuid: string;
  peer: Peer;
  manager: AudioSourcesSinksManager;
  startedAt: number;
  // TODO handle dynamic latency
  latency = 2000;

  abstract _getAudioEncodedStream(): Promise<NodeJS.ReadableStream> | NodeJS.ReadableStream;

  constructor(descriptor: SourceDescriptor, manager: AudioSourcesSinksManager) {
    this.manager = manager;
    this.type = descriptor.type;
    this.uuid = descriptor.uuid || uuidv4();
    this.peer = descriptor.peer || localPeer;
    this.updateInfo(descriptor);
    this.log = debug(`soundsync:audioSource:${this.uuid}`);
    this.log(`Created new audio source`);
  }

  updateInfo(descriptor: SourceDescriptor) {
    ['name', 'startedAt', 'latency'].forEach(prop => {
      if (descriptor[prop]) {
        this[prop] = descriptor[prop];
      }
    });
  }

  async start(): Promise<NodeJS.ReadableStream> {
    this.log(`Starting audio source`);
    const encodedAudioStream = await this._getAudioEncodedStream();
    if (this.local) {
      this.startedAt = getCurrentSynchronizedTime();
      this.manager.emit('sourceUpdate', this);
    }
    return encodedAudioStream;
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
