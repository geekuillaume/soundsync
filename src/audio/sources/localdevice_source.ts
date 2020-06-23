import { PassThrough } from 'stream';
import {
  Soundio, SoundioDevice, SoundioInputStream,
} from 'audioworklet';
import { resolve } from 'path';
import { getInputDeviceFromId, shouldUseAudioStreamName } from '../../utils/soundio';
import { CircularTypedArray } from '../../utils/circularTypedArray';

import { OPUS_ENCODER_RATE } from '../../utils/constants';
import { AudioSource } from './audio_source';
import { LocalDeviceSourceDescriptor } from './source_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { createAudioEncodedStream } from '../../utils/opus_streams';
import { AudioInstance } from '../utils';

export class LocalDeviceSource extends AudioSource {
  type: 'localdevice' = 'localdevice';
  local = true;
  rate = 48000;
  channels = 2;
  deviceId: string;
  buffer: CircularTypedArray<Float32Array>;

  private soundioDevice: SoundioDevice;
  private soundioInputStream: SoundioInputStream;
  private cleanStream: () => any;

  constructor(descriptor: LocalDeviceSourceDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.deviceId = descriptor.deviceId;
  }

  async _getAudioEncodedStream() {
    this.log(`Creating localdevice source`);
    this.soundioDevice = await getInputDeviceFromId(this.deviceId);
    const inputStream = new PassThrough();
    this.soundioInputStream = this.soundioDevice.openInputStream({
      sampleRate: OPUS_ENCODER_RATE,
      name: shouldUseAudioStreamName() ? this.name : undefined,
      format: Soundio.SoundIoFormatS16LE,
      bufferDuration: 2,
    });
    this.soundioInputStream.start();
    const worklet = this.soundioInputStream.attachProcessFunctionFromWorker(resolve(__dirname, './audioworklets/input_audioworklet.js'));
    worklet.on('message', (d) => {
      inputStream.write(Buffer.from(d.buffer));
    });
    const stream = createAudioEncodedStream(inputStream, OPUS_ENCODER_RATE, 2);

    this.cleanStream = () => {
      this.soundioInputStream.close();
      inputStream.end();
      delete this.soundioInputStream;
      delete this.soundioDevice;
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
      peerUuid: this.peerUuid,
      instanceUuid: this.instanceUuid,
      latency: this.latency,
      startedAt: this.startedAt,
      available: this.available,
    }),
  })
}
