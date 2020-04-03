import { Worker } from 'worker_threads';
import {
  Soundio,
} from 'audioworklet';

import { resolve } from 'path';
import { AudioChunkStreamOutput } from '../../utils/chunk_stream';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import {
  OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_SAMPLES_COUNT, MIN_SKEW_TO_RESYNC_AUDIO,
} from '../../utils/constants';
import { LocalDeviceSinkDescriptor } from './sink_type';
import { getOutputDeviceIndexFromId } from '../../utils/soundio';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { AudioInstance } from '../utils';

export class LocalDeviceSink extends AudioSink {
  type: 'localdevice' = 'localdevice';
  local: true = true;
  deviceId: string;

  soundio: Soundio;
  private worklet: Worker;
  private cleanStream;

  constructor(descriptor: LocalDeviceSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.deviceId = descriptor.deviceId;
  }

  async _startSink(source: AudioSource) {
    this.log(`Creating speaker`);
    await source.peer.waitForFirstTimeSync();
    this.soundio = new Soundio();
    const openStream = () => {
      this.soundio.openOutputStream({
        deviceId: this.deviceId ? getOutputDeviceIndexFromId(this.deviceId) : undefined,
        sampleRate: OPUS_ENCODER_RATE,
        name: `${source.name}`,
        format: Soundio.SoundIoFormatFloat32LE,
        bufferDuration: 0.1,
      });
      this.soundio.startOutputStream();
    };
    openStream();

    this.updateInfo({ latency: this.soundio.getStreamLatency() * 1000 });
    this.worklet = this.soundio.attachProcessFunctionFromWorker(resolve(__dirname, './audioworklets/node_audioworklet.js'));
    this.sendStreamTimeToWorklet();

    const latencyInterval = setInterval(() => {
      if (!this.soundio.isOutputStreamOpen()) {
        return;
      }
      const newLatency = this.soundio.getStreamLatency() * 1000;
      if (Math.abs(newLatency - this.latency) > MIN_SKEW_TO_RESYNC_AUDIO) {
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
      this.soundio.closeOutputStream();
      delete this.soundio;
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
      type: 'currentStreamTime',
      currentStreamTime: this.getCurrentStreamTime(),
    });
  }

  toDescriptor: (() => AudioInstance<LocalDeviceSinkDescriptor>) = () => ({
    type: this.type,
    name: this.name,
    uuid: this.uuid,
    deviceId: this.deviceId,
    peerUuid: this.peerUuid,
    instanceUuid: this.instanceUuid,
    pipedFrom: this.pipedFrom,
    latency: this.latency,
  })
}
