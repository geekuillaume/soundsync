// import Speaker from 'speaker';
import {
  RtAudio, RtAudioFormat, RtAudioStreamFlags, RtAudioStreamParameters,
} from 'audify';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_FRAME_SAMPLES_COUNT, OPUS_ENCODER_SAMPLES_PER_SECONDS } from '../../utils/constants';
import { RtAudioSinkDescriptor } from './sink_type';
import { getAudioDevices } from '../../utils/rtaudio';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';

// used to prevent stream cut if trying to send chunk just in time
// this adds a latency but is necessary as the nodejs thread is not running in real time
const AUDIO_PADDER_DURATION = 100;

export class RtAudioSink extends AudioSink {
  type: 'rtaudio' = 'rtaudio';
  local: true = true;
  deviceName: string;

  rtaudio: RtAudio;
  private cleanStream;
  private wroteLastTick = false;

  constructor(descriptor: RtAudioSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.deviceName = descriptor.deviceName;
  }

  _startSink(source: AudioSource) {
    const outputConfig: RtAudioStreamParameters = { nChannels: source.channels };
    if (this.deviceName) {
      outputConfig.deviceId = getAudioDevices().map(({ name }) => name).indexOf(this.deviceName);
      if (outputConfig.deviceId === -1) {
        delete outputConfig.deviceId;
      }
    }
    this.log(`Creating speaker`);
    this.rtaudio = new RtAudio();
    this.rtaudio.openStream(
      outputConfig, // output stream
      null, // input stream
      RtAudioFormat.RTAUDIO_SINT16, // format
      OPUS_ENCODER_RATE, // rate
      OPUS_ENCODER_FRAME_SAMPLES_COUNT, // samples per frame
      `soundsync-${source.name}`, // name
      null, // input callback, not used
      null,
      RtAudioStreamFlags.RTAUDIO_MINIMIZE_LATENCY, // stream flags
    );
    this.rtaudio.start();
    const latencyInterval = setInterval(() => {
      if (!this.rtaudio.isStreamOpen) {
        return;
      }
      const newLatency = (this.rtaudio.getStreamLatency() / OPUS_ENCODER_RATE) * 1000;
      if (Math.abs(newLatency - this.latency) > 5) {
        // TODO: use network latency here too
        this.updateInfo({ latency: newLatency });
      }
    }, 2000);
    const writeInterval = setInterval(this.writeNextAudioChunk, (1000 / OPUS_ENCODER_SAMPLES_PER_SECONDS) / 2);
    this.cleanStream = () => {
      clearInterval(writeInterval);
      clearInterval(latencyInterval);
      this.rtaudio.closeStream();
    };
  }

  _stopSink() {
    if (this.cleanStream) {
      this.cleanStream();
      delete this.cleanStream;
    }
  }

  writeNextAudioChunk = () => {
    const chunk = this.getAudioChunkAtDelayFromNow();
    if (chunk) {
      if (!this.wroteLastTick) {
        const audioPadder = Buffer.alloc((1 / AUDIO_PADDER_DURATION) * OPUS_ENCODER_RATE * this.channels * 2);
        this.rtaudio.write(audioPadder);
      }
      this.rtaudio.write(chunk);
      this.wroteLastTick = true;
    }
  }

  toDescriptor: (() => RtAudioSinkDescriptor) = () => ({
    type: 'rtaudio',
    name: this.name,
    uuid: this.uuid,
    deviceName: this.deviceName,
    peerUuid: this.peerUuid,
  })
}
