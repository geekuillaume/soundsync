import { Worker } from 'worker_threads';
import {
  Soundio,
  SoundioDevice,
  SoundioOutputStream,
} from 'audioworklet';

import { resolve } from 'path';
import { AudioChunkStreamOutput } from '../../utils/chunk_stream';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import {
  OPUS_ENCODER_RATE, MIN_SKEW_TO_RESYNC_AUDIO, OPUS_ENCODER_CHUNK_SAMPLES_COUNT, MIN_AUDIODEVICE_CLOCK_SKEW_TO_RESYNC_AUDIO,
} from '../../utils/constants';
import { LocalDeviceSinkDescriptor } from './sink_type';
import { getOutputDeviceFromId } from '../../utils/soundio';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { AudioInstance } from '../utils';
import { CircularTypedArray } from './audioworklets/circularTypedArray';

const BUFFER_DURATION = 10000;

export class LocalDeviceSink extends AudioSink {
  type: 'localdevice' = 'localdevice';
  local: true = true;
  deviceId: string;
  buffer: CircularTypedArray<Float32Array>;

  private worklet: Worker;
  private cleanStream;
  private soundioDevice: SoundioDevice;
  private soundioOutputStream: SoundioOutputStream;

  constructor(descriptor: LocalDeviceSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.deviceId = descriptor.deviceId;
    this.available = this.isDeviceAvailable();
    setInterval(() => { // this should be changed to use events from soundio instead
      this.updateInfo({ available: this.isDeviceAvailable() });
    }, 5000);
  }

  isDeviceAvailable = () => !!getOutputDeviceFromId(this.deviceId)

  async _startSink(source: AudioSource) {
    this.log(`Creating speaker`);
    await source.peer.waitForFirstTimeSync();
    this.soundioDevice = getOutputDeviceFromId(this.deviceId);
    this.soundioOutputStream = this.soundioDevice.openOutputStream({
      sampleRate: OPUS_ENCODER_RATE,
      name: `${source.name}`,
      format: Soundio.SoundIoFormatFloat32LE,
      bufferDuration: 0.1,
    });
    this.worklet = this.soundioOutputStream.attachProcessFunctionFromWorker(resolve(__dirname, './audioworklets/node_audioworklet.js'));
    this.soundioOutputStream.start();

    const bufferSize = (BUFFER_DURATION / 1000) * OPUS_ENCODER_RATE * this.channels * Float32Array.BYTES_PER_ELEMENT;
    const bufferData = new SharedArrayBuffer(bufferSize);
    this.buffer = new CircularTypedArray(Float32Array, bufferData);

    this.updateInfo({ latency: this.soundioOutputStream.getLatency() * 1000 });
    this.setStreamTimeForWorklet();
    this.worklet.postMessage({
      type: 'buffer',
      buffer: bufferData,
      pointersBuffer: this.buffer.getPointersBuffer(),
    });

    const latencyInterval = setInterval(() => {
      if (!this.soundioOutputStream.isOpen()) {
        return;
      }
      const newLatency = this.soundioOutputStream.getLatency() * 1000;
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
      this.soundioOutputStream.setVolume(this.volume);
    };
    this.on('update', syncDeviceVolume);

    const resyncInterval = setInterval(() => {
      const skew = Math.abs(this.buffer.getReaderPointer() - this.getIdealBufferReadPosition());
      if (skew > MIN_AUDIODEVICE_CLOCK_SKEW_TO_RESYNC_AUDIO
          * (OPUS_ENCODER_RATE / 1000)
          * this.channels) {
        this.log(`Resync because of audio clock skew: ${skew / ((OPUS_ENCODER_RATE / 1000) * this.channels)}ms`);
        this.setStreamTimeForWorklet();
      }
    }, 5000);

    this.cleanStream = () => {
      if (this.pipedSource.peer) {
        this.pipedSource.peer.off('timedeltaUpdated', handleTimedeltaUpdate);
      }
      this.off('update', syncDeviceVolume);
      clearInterval(latencyInterval);
      clearInterval(resyncInterval);
      this.soundioOutputStream.close();
      delete this.soundioOutputStream;
      delete this.soundioDevice;
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
    const chunk = new Float32Array(data.chunk.buffer);
    const offset = data.i * OPUS_ENCODER_CHUNK_SAMPLES_COUNT * this.channels;
    this.buffer.set(chunk, offset);
  }

  getIdealBufferReadPosition = () => this.getCurrentStreamTime()
    * (OPUS_ENCODER_RATE / 1000)
    * this.channels;

  setStreamTimeForWorklet = () => {
    if (!this.buffer) {
      return;
    }
    this.buffer.setReaderPointer(this.getIdealBufferReadPosition());
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
