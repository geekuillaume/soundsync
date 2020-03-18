import {
  RtAudio, RtAudioFormat, RtAudioStreamFlags, RtAudioStreamParameters, RtAudioApi,
} from 'audify';
import _ from 'lodash';

import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import {
  OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_SAMPLES_COUNT, OPUS_ENCODER_CHUNK_DURATION,
} from '../../utils/constants';
import { RtAudioSinkDescriptor } from './sink_type';
import { getAudioDevices } from '../../utils/rtaudio';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { AudioInstance } from '../utils';

// used to prevent stream cut if trying to send chunk just in time
// this adds a latency but is necessary as the nodejs thread is not running in real time
const AUDIO_PADDER_DURATION = 30;

export class RtAudioSink extends AudioSink {
  type: 'rtaudio' = 'rtaudio';
  local: true = true;
  deviceName: string;

  rtaudio: RtAudio;
  private cleanStream;
  private nextChunkIndex = -1;

  constructor(descriptor: RtAudioSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.deviceName = descriptor.deviceName;
  }

  async _startSink(source: AudioSource) {
    const outputConfig: RtAudioStreamParameters = { nChannels: source.channels };
    if (this.deviceName) {
      outputConfig.deviceId = getAudioDevices().map(({ name }) => name).indexOf(this.deviceName);
      if (outputConfig.deviceId === -1) {
        delete outputConfig.deviceId;
      }
    }
    this.log(`Creating speaker`);
    await source.peer.waitForFirstTimeSync();
    this.nextChunkIndex = -1;
    this.rtaudio = new RtAudio();
    const openStream = () => {
      this.rtaudio.openStream(
        outputConfig, // output stream
        null, // input stream
        RtAudioFormat.RTAUDIO_SINT16, // format
        OPUS_ENCODER_RATE, // rate
        OPUS_ENCODER_CHUNK_SAMPLES_COUNT, // samples per frame
        `soundsync-${source.name}`, // name
        null, // input callback, not used
        this._handleFrameEmitted,
        RtAudioStreamFlags.RTAUDIO_MINIMIZE_LATENCY, // stream flags
      );
    };
    try {
      openStream();
    } catch (e) {
      // if we are running in headless, pulse probably isn't started, so we fallback to alsa
      if (e.message === 'RtApiPulse::probeDeviceOpen: error connecting output to PulseAudio server.') {
        this.rtaudio = new RtAudio(RtAudioApi.LINUX_ALSA);
        delete outputConfig.deviceId;
        openStream();
      } else {
        throw e;
      }
    }
    this.rtaudio.start();
    // write an empty buffer to trigger the _handleFrameEmitted callback
    this.rtaudio.write(Buffer.alloc(OPUS_ENCODER_CHUNK_SAMPLES_COUNT * this.channels * 2));
    const latencyInterval = setInterval(() => {
      if (!this.rtaudio.isStreamOpen) {
        return;
      }
      const newLatency = (this.rtaudio.getStreamLatency() / OPUS_ENCODER_RATE) * 1000;
      if (Math.abs(newLatency - this.latency) > 5) {
        // TODO: use network latency here too
        this.updateInfo({ latency: newLatency });
        this.nextChunkIndex = -1;
      }
    }, 2000);
    const handleTimedeltaUpdate = () => {
      this.nextChunkIndex = -1;
    };
    this.pipedSource.peer.on('timedeltaUpdated', handleTimedeltaUpdate);
    this.cleanStream = () => {
      if (this.pipedSource.peer) {
        this.pipedSource.peer.off('timedeltaUpdated', handleTimedeltaUpdate);
      }
      clearInterval(latencyInterval);
      this.rtaudio.closeStream();
      delete this.rtaudio;
    };
  }

  _stopSink() {
    if (this.cleanStream) {
      this.cleanStream();
      delete this.cleanStream;
    }
  }

  _handleFrameEmitted = () => {
    if (!this.rtaudio) {
      // the sink is closed, bailing out as we shouldn't write anything
      return;
    }
    if (this.nextChunkIndex === -1) {
      this.nextChunkIndex = this.getCurrentChunkIndex();
      _.times(AUDIO_PADDER_DURATION / OPUS_ENCODER_CHUNK_DURATION, () => {
        // the audio padder is used to delay the start of the internal rtaudio buffer read
        this.rtaudio.write(Buffer.alloc(OPUS_ENCODER_CHUNK_SAMPLES_COUNT * this.channels * 2));
      });
    }
    // console.log(`- ${this.nextChunkIndex}`);
    const chunk = this.buffer[this.nextChunkIndex];
    delete this.buffer[this.nextChunkIndex];
    this.nextChunkIndex++;

    if (chunk) {
      this.rtaudio.write(chunk);
    } else {
      this.rtaudio.write(Buffer.alloc(OPUS_ENCODER_CHUNK_SAMPLES_COUNT * this.channels * 2));
    }
  }

  toDescriptor: (() => AudioInstance<RtAudioSinkDescriptor>) = () => ({
    type: 'rtaudio',
    name: this.name,
    uuid: this.uuid,
    deviceName: this.deviceName,
    peerUuid: this.peerUuid,
    instanceUuid: this.instanceUuid,
    pipedFrom: this.pipedFrom,
    latency: this.latency,
  })
}
