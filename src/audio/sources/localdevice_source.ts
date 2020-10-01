import { PassThrough } from 'stream';
import {
  AudioServer, AudioStream,
} from 'audioworklet';
import {
  getInputDeviceFromId, getClosestMatchingRate, getAudioServer, getOutputDeviceFromId,
} from '../../utils/audio/localAudioDevice';
import { CircularTypedArray } from '../../utils/circularTypedArray';

import { OPUS_ENCODER_RATE } from '../../utils/constants';
import { AudioSource } from './audio_source';
import { LocalDeviceSourceDescriptor } from './source_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { createAudioChunkStream } from '../../utils/audio/chunk_stream';
import { AudioInstance } from '../utils';

export class LocalDeviceSource extends AudioSource {
  type: 'localdevice' = 'localdevice';
  local = true;
  rate = OPUS_ENCODER_RATE;
  channels = 2;
  deviceId: string;
  isLoopback: boolean;
  buffer: CircularTypedArray<Float32Array>;

  private audioStream: AudioStream;
  private cleanStream: () => any;

  constructor(descriptor: LocalDeviceSourceDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.deviceId = descriptor.deviceId;
    this.isLoopback = descriptor.isLoopback ?? false;
    this.updateDeviceInfo();
    // TODO: clearInterval this when source is deleted
    setInterval(this.updateDeviceInfo, 5000);
  }

  isDeviceAvailable = () => Boolean(this.isLoopback ? getOutputDeviceFromId(this.deviceId) : getInputDeviceFromId(this.deviceId))
  private updateDeviceInfo = async () => {
    this.updateInfo({
      available: this.isDeviceAvailable(),
    });
  }

  _getAudioChunkStream = async () => {
    this.log(`Creating localdevice source`);
    const device = getInputDeviceFromId(this.deviceId);
    this.rate = getClosestMatchingRate(device, OPUS_ENCODER_RATE);
    const inputStream = new PassThrough();
    this.audioStream = getAudioServer().initInputStream(device.id, {
      sampleRate: this.rate,
      name: this.name,
      format: AudioServer.S16LE,
      latencyFrames: this.rate / 10,
    }, this.isLoopback);
    this.audioStream.start();
    this.audioStream.registerReadHandler((d) => {
      inputStream.write(Buffer.from(d.buffer, d.byteOffset, d.byteLength));
    });

    const stream = createAudioChunkStream(this.startedAt, inputStream, this.rate, this.channels);

    this.cleanStream = () => {
      this.audioStream.stop();
      inputStream.end();
      delete this.audioStream;
      delete this.cleanStream;
    };

    return stream;
  }

  _stop = () => {
    if (this.cleanStream) {
      this.cleanStream();
    }
  }

  toDescriptor = (sanitizeForConfigSave = false): AudioInstance<LocalDeviceSourceDescriptor> => ({
    type: 'localdevice',
    name: this.name,
    uuid: this.uuid,
    deviceId: this.deviceId,
    channels: this.channels,
    isLoopback: this.isLoopback,

    ...(!sanitizeForConfigSave && {
      error: this.error,
      peerUuid: this.peerUuid,
      instanceUuid: this.instanceUuid,
      latency: this.latency,
      startedAt: this.startedAt,
      available: this.available,
      active: this.active,
      started: this.started,
    }),
  })
}
