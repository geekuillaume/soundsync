import { PassThrough } from 'stream';
import {
  AudioServer, AudioStream,
} from 'audioworklet';
import { resolve } from 'path';
import { getInputDeviceFromId, getClosestMatchingRate, getAudioServer } from '../../utils/audio/localAudioDevice';
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
  buffer: CircularTypedArray<Float32Array>;

  private audioStream: AudioStream;
  private cleanStream: () => any;

  constructor(descriptor: LocalDeviceSourceDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.deviceId = descriptor.deviceId;
  }

  async _getAudioChunkStream() {
    this.log(`Creating localdevice source`);
    const device = await getInputDeviceFromId(this.deviceId);
    this.rate = getClosestMatchingRate(device, OPUS_ENCODER_RATE);
    const inputStream = new PassThrough();
    this.audioStream = getAudioServer().initInputStream(device.id, {
      sampleRate: this.rate,
      name: this.name,
      format: AudioServer.S16LE,
      latencyFrames: this.rate / 10,
    });
    this.audioStream.start();
    const worklet = this.audioStream.attachProcessFunctionFromWorker(resolve(__dirname, './audioworklets/input_audioworklet.js'));
    worklet.on('message', (d) => {
      inputStream.write(Buffer.from(d.buffer));
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
