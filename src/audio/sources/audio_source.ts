import debug from 'debug';
import uuidv4 from 'uuid/v4';

import { PassThrough } from 'stream';
import { SourceDescriptor, SourceType, BaseSourceDescriptor } from './source_type';
import { getCurrentSynchronizedTime } from '../../coordinator/timekeeper';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';

// This is an abstract class that shouldn't be used directly but implemented by real audio sources
export abstract class AudioSource {
  name: string;
  type: SourceType;
  rate = 0;
  channels: number;
  log: debug.Debugger;
  local: boolean;
  uuid: string;
  peerUuid: string;
  manager: AudioSourcesSinksManager;
  // we separate the two streams so that we can synchronously create the encodedAudioStream which will be empty while the
  // real source initialize, this simplify the code needed to handle the source being started twice at the same time
  encodedAudioStream: PassThrough; // stream used to redistribute the audio chunks to every sink
  private directSourceStream: NodeJS.ReadableStream; // internal stream from the source
  startedAt: number;
  latency = 500;

  abstract _getAudioEncodedStream(): Promise<NodeJS.ReadableStream> | NodeJS.ReadableStream;

  constructor(descriptor: SourceDescriptor, manager: AudioSourcesSinksManager) {
    this.manager = manager;
    this.type = descriptor.type;
    this.uuid = descriptor.uuid || uuidv4();
    this.peerUuid = descriptor.peerUuid;
    this.name = descriptor.name;
    this.startedAt = descriptor.startedAt;
    this.latency = descriptor.latency || 500;
    this.channels = descriptor.channels;
    this.log = debug(`soundsync:audioSource:${this.uuid}`);
    this.log(`Created new audio source`);
  }

  // Change info about a source in response to a user event
  patch(descriptor: Partial<SourceDescriptor>) {
    return this.updateInfo(descriptor);
  }

  // Update source info in response to a controllerMessage
  updateInfo(descriptor: Partial<SourceDescriptor>) {
    let hasChanged = false;
    Object.keys(descriptor).forEach((prop) => {
      if (descriptor[prop] && this[prop] !== descriptor[prop]) {
        hasChanged = true;
        this[prop] = descriptor[prop];
      }
    });
    if (hasChanged) {
      this.manager.emit('sourceUpdate', this);
    }
  }

  async start(): Promise<PassThrough> {
    this.log(`Starting audio source`);
    if (!this.encodedAudioStream) {
      this.encodedAudioStream = new PassThrough();
      if (this.local) {
        this.updateInfo({ startedAt: getCurrentSynchronizedTime() });
      }
      this.directSourceStream = await this._getAudioEncodedStream();
      this.directSourceStream.pipe(this.encodedAudioStream);
    }
    // we use a PassThrough here instead of sending this.encodedAudioStream to simplify the detection of a stream close event
    const sourceStream = new PassThrough();
    // TODO count stream references to close encodedStream if no usage
    this.encodedAudioStream.pipe(sourceStream);
    return sourceStream;
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

  toDescriptor = (): BaseSourceDescriptor => ({
    name: this.name,
    uuid: this.uuid,
    type: this.type,
    latency: this.latency,
    startedAt: this.startedAt,
    peerUuid: this.peerUuid,
  })
}
