import { Worker } from 'worker_threads';
import {
  Soundio,
} from 'audioworklet';

import { resolve } from 'path';
import { AudioChunkStreamOutput } from '../../utils/chunk_stream';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import {
  OPUS_ENCODER_RATE, MIN_SKEW_TO_RESYNC_AUDIO, OPUS_ENCODER_CHUNK_DURATION,
} from '../../utils/constants';
import { LocalDeviceSinkDescriptor } from './sink_type';
import { getOutputDeviceIndexFromId } from '../../utils/soundio';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { AudioInstance } from '../utils';
import { CircularTypedArray } from './audioworklets/circularTypedArray';

const BUFFER_DURATION = 10000;

export class LocalDeviceSink extends AudioSink {
  type: 'localdevice' = 'localdevice';
  local: true = true;
  deviceId: string;
  buffer: CircularTypedArray<Float32Array>;
  lastReceivedChunk = -1;
  soundio: Soundio;
  private worklet: Worker;
  private cleanStream;

  constructor(descriptor: LocalDeviceSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.deviceId = descriptor.deviceId;
    this.available = this.isDeviceAvailable();
    setInterval(() => { // this should be changed to use events from soundio instead
      this.updateInfo({ available: this.isDeviceAvailable() });
    }, 5000);
  }

  isDeviceAvailable = () => getOutputDeviceIndexFromId(this.deviceId) !== -1

  async _startSink(source: AudioSource) {
    this.log(`Creating speaker`);
    await source.peer.waitForFirstTimeSync();
    this.soundio = new Soundio();
    this.soundio.openOutputStream({
      deviceId: getOutputDeviceIndexFromId(this.deviceId),
      sampleRate: OPUS_ENCODER_RATE,
      name: `${source.name}`,
      format: Soundio.SoundIoFormatFloat32LE,
      bufferDuration: 0.1,
    });
    this.soundio.startOutputStream();

    const bufferSize = (BUFFER_DURATION / 1000) * OPUS_ENCODER_RATE * this.channels * Float32Array.BYTES_PER_ELEMENT;
    const bufferData = new SharedArrayBuffer(bufferSize);
    this.buffer = new CircularTypedArray(Float32Array, bufferData);

    this.updateInfo({ latency: this.soundio.getStreamLatency() * 1000 });
    this.worklet = this.soundio.attachProcessFunctionFromWorker(resolve(__dirname, './audioworklets/node_audioworklet.js'));
    this.setStreamTimeForWorklet();
    this.worklet.postMessage({
      type: 'buffer',
      buffer: bufferData,
      pointersBuffer: this.buffer.getPointersBuffer(),
    });

    const latencyInterval = setInterval(() => {
      if (!this.soundio.isOutputStreamOpen()) {
        return;
      }
      const newLatency = this.soundio.getStreamLatency() * 1000;
      if (Math.abs(newLatency - this.latency) > MIN_SKEW_TO_RESYNC_AUDIO) {
        this.log(`Updating sink latency to ${newLatency}`);
        // TODO: use network latency here too
        this.updateInfo({ latency: newLatency });
        this.setStreamTimeForWorklet();
      }
    }, 2000);

    const handleTimedeltaUpdate = () => {
      this.log(`Resynchronizing sink after timedelta`);
      this.setStreamTimeForWorklet();
    };
    this.pipedSource.peer.on('timedeltaUpdated', handleTimedeltaUpdate);
    const syncDeviceVolume = () => {
      this.soundio.setOutputVolume(this.volume);
    };
    this.on('update', syncDeviceVolume);

    this.cleanStream = () => {
      if (this.pipedSource.peer) {
        this.pipedSource.peer.off('timedeltaUpdated', handleTimedeltaUpdate);
      }
      this.off('update', syncDeviceVolume);
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
    if (!this.pipedSource || !this.pipedSource.peer) {
      this.log(`Received a chunk for a not piped sink, ignoring`);
      return;
    }
    if ((data.i * 10 + this.pipedSource.startedAt) - this.pipedSource.peer.getCurrentTime() < -200) {
      // we received old chunks, discard them
      return;
    }
    if (this.lastReceivedChunk !== -1 && data.i !== this.lastReceivedChunk + 1) {
      this.log(`Received out-of-order chunk, received chunk index: ${data.i}, last chunk index: ${this.lastReceivedChunk}`);
    }
    const chunk = new Float32Array(data.chunk.buffer);
    const offset = data.i * OPUS_ENCODER_CHUNK_DURATION * (OPUS_ENCODER_RATE / 1000) * this.channels;
    this.buffer.set(chunk, offset);
    this.lastReceivedChunk = data.i;
  }

  setStreamTimeForWorklet = () => {
    if (!this.buffer) {
      return;
    }
    this.buffer.setReaderPointer(this.getCurrentStreamTime()
      * (OPUS_ENCODER_RATE / 1000)
      * this.channels);
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
    available: this.available,
    volume: this.volume,
  })
}
