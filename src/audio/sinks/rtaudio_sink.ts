import { Worker } from 'worker_threads';
import {
  RtAudio, RtAudioFormat, RtAudioStreamFlags, RtAudioStreamParameters, RtAudioApi,
} from 'audioworklet';

import { resolve } from 'path';
import { AudioChunkStreamOutput } from '../../utils/chunk_stream';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import {
  OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_SAMPLES_COUNT,
} from '../../utils/constants';
import { RtAudioSinkDescriptor } from './sink_type';
import { getAudioDevices } from '../../utils/rtaudio';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { AudioInstance } from '../utils';

export class RtAudioSink extends AudioSink {
  type: 'rtaudio' = 'rtaudio';
  local: true = true;
  deviceName: string;

  rtaudio: RtAudio;
  private worklet: Worker;
  private cleanStream;

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
    this.rtaudio = new RtAudio();
    const openStream = () => {
      this.rtaudio.openStream(
        outputConfig, // output stream
        null, // input stream
        RtAudioFormat.RTAUDIO_FLOAT32, // format
        OPUS_ENCODER_RATE, // rate
        OPUS_ENCODER_CHUNK_SAMPLES_COUNT, // samples per frame
        `soundsync-${source.name}`, // name
        undefined,
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
    this.worklet = this.rtaudio.attachProcessFunctionFromWorker(resolve(__dirname, './audioworklets/rtaudio_worklet.js'));
    this.rtaudio.start();
    this.sendStreamTimeToWorklet();

    const latencyInterval = setInterval(() => {
      if (!this.rtaudio.isStreamOpen) {
        return;
      }
      const newLatency = (this.rtaudio.getStreamLatency() / OPUS_ENCODER_RATE) * 1000;
      if (Math.abs(newLatency - this.latency) > 5) {
        this.log(`Updating sink latency to ${newLatency}`);
        // TODO: use network latency here too
        this.updateInfo({ latency: newLatency });
        this.sendStreamTimeToWorklet();
      }
    }, 2000);

    const handleTimedeltaUpdate = () => {
      this.log(`Resynchronizing sink after timedelta`);
      this.sendStreamTimeToWorklet();
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

  handleAudioChunk = (data: AudioChunkStreamOutput) => {
    if (!this.worklet) {
      return;
    }
    if ((data.i * 10 + this.pipedSource.startedAt) - this.pipedSource.peer.getCurrentTime() < -200) {
      // we received old chunks, discard them
      return;
    }
    const chunk = new Float32Array(data.chunk.buffer);
    this.worklet.postMessage({
      type: 'chunk',
      i: data.i,
      chunk,
    }, [chunk.buffer]); // we transfer the chunk.buffer to the audio worklet to prevent a memory copy
  }

  sendStreamTimeToWorklet = () => {
    if (!this.worklet) {
      return;
    }
    this.worklet.postMessage({
      type: 'currentChunkIndex',
      currentChunkIndex: this.getCurrentChunkIndex(),
    });
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
