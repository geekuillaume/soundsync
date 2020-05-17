import { PassThrough } from 'stream';
import {
  Soundio, SoundioDevice, SoundioInputStream,
} from 'audioworklet';
import { getInputDeviceFromId } from '../../utils/soundio';
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

  _getAudioEncodedStream() {
    this.log(`Creating localdevice sink`);
    this.soundioDevice = getInputDeviceFromId(this.deviceId);
    const inputStream = new PassThrough();
    this.soundioInputStream = this.soundioDevice.openInputStream({
      sampleRate: OPUS_ENCODER_RATE,
      name: this.name,
      format: Soundio.SoundIoFormatS16LE,
      bufferDuration: 2,
      process: (inputChannels) => {
        // we need interleaved samples for the encoded stream
        const interleaved = new Int16Array(inputChannels[0].length * 2);
        for (let sample = 0; sample < inputChannels[0].length; sample++) {
          interleaved[sample * 2] = inputChannels[0][sample];
          interleaved[(sample * 2) + 1] = inputChannels[1][sample];
        }

        const canWrite = inputStream.write(Buffer.from(interleaved.buffer));
        console.log(canWrite);
        return true;
      },
    });
    this.soundioInputStream.start();
    const stream = createAudioEncodedStream(inputStream, OPUS_ENCODER_RATE, 2);

    this.cleanStream = () => {
      this.soundioInputStream.close();
      inputStream.destroy();
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

  toDescriptor: (() => AudioInstance<LocalDeviceSourceDescriptor>) = () => ({
    type: 'localdevice',
    name: this.name,
    uuid: this.uuid,
    deviceId: this.deviceId,
    peerUuid: this.peerUuid,
    instanceUuid: this.instanceUuid,
    channels: this.channels,
    latency: this.latency,
    startedAt: this.startedAt,
    available: this.available,
  })
}
