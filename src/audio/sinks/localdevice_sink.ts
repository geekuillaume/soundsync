import { Worker } from 'worker_threads';
import {
  Soundio,
  SoundioDevice,
  SoundioOutputStream,
} from 'audioworklet';

import { resolve } from 'path';
import debug from 'debug';
import { now } from '../../utils/misc';
import { AudioChunkStreamOutput } from '../../utils/audio/chunk_stream';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import {
  OPUS_ENCODER_RATE, MIN_SKEW_TO_RESYNC_AUDIO, OPUS_ENCODER_CHUNK_SAMPLES_COUNT, MAX_LATENCY,
} from '../../utils/constants';
import { LocalDeviceSinkDescriptor } from './sink_type';
import { getOutputDeviceFromId, shouldUseAudioStreamName } from '../../utils/audio/soundio';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { AudioInstance } from '../utils';
import { CircularTypedArray } from '../../utils/circularTypedArray';

export class LocalDeviceSink extends AudioSink {
  type: 'localdevice' = 'localdevice';
  local: true = true;
  deviceId: string;
  buffer: CircularTypedArray<Float32Array>;
  delayFromLocalNowBuffer = new Float64Array(new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT));

  private worklet: Worker;
  private cleanStream;
  private soundioDevice: SoundioDevice;
  private soundioOutputStream: SoundioOutputStream;

  constructor(descriptor: LocalDeviceSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.deviceId = descriptor.deviceId;
    this.available = false; // device is considered not available at first before this.updateAvailability
    this.updateAvailability();
    setInterval(this.updateAvailability, 5000);
  }

  isDeviceAvailable = async () => !!(await getOutputDeviceFromId(this.deviceId))
  private updateAvailability = async () => {
    this.updateInfo({ available: await this.isDeviceAvailable() });
  }

  async _startSink(source: AudioSource) {
    this.log(`Creating speaker`);
    await source.peer.waitForFirstTimeSync();
    this.soundioDevice = await getOutputDeviceFromId(this.deviceId);
    this.soundioOutputStream = this.soundioDevice.openOutputStream({
      sampleRate: OPUS_ENCODER_RATE,
      name: shouldUseAudioStreamName() ? source.name : undefined,
      format: Soundio.SoundIoFormatFloat32LE,
      bufferDuration: 0.1,
    });
    this.worklet = this.soundioOutputStream.attachProcessFunctionFromWorker(resolve(__dirname, './audioworklets/node_audioworklet.js'));
    this.soundioOutputStream.start();

    const bufferSize = MAX_LATENCY * (OPUS_ENCODER_RATE / 1000) * this.channels * Float32Array.BYTES_PER_ELEMENT;
    const bufferData = new SharedArrayBuffer(bufferSize);
    this.buffer = new CircularTypedArray(Float32Array, bufferData);

    this.updateInfo({ latency: this.soundioOutputStream.getLatency() * 1000 });
    this.setDelayFromLocalNow();
    this.worklet.postMessage({
      type: 'buffer',
      buffer: bufferData,
      delayFromLocalNowBuffer: this.delayFromLocalNowBuffer.buffer,
      channels: this.channels,
      debug: debug.enabled('soundsync:audioSinkDebug'),
    });

    const latencyInterval = setInterval(() => {
      if (!this.soundioOutputStream.isOpen()) {
        return;
      }
      const newLatency = this.soundioOutputStream.getLatency() * 1000;
      this.setDelayFromLocalNow();
      if (Math.abs(newLatency - this.latency) > MIN_SKEW_TO_RESYNC_AUDIO) {
        this.log(`Updating sink latency to ${newLatency}`);
        // TODO: use network latency here too
        this.updateInfo({ latency: newLatency });
      }
    }, 2000);

    const handleTimedeltaUpdate = () => {
      this.log(`Resynchronizing sink after timedelta`);
      this.setDelayFromLocalNow();
    };
    this.pipedSource.peer.on('timedeltaUpdated', handleTimedeltaUpdate);
    const syncDeviceVolume = () => {
      this.soundioOutputStream.setVolume(this.volume);
    };
    this.on('update', syncDeviceVolume);

    this.cleanStream = () => {
      if (this.pipedSource.peer) {
        this.pipedSource.peer.off('timedeltaUpdated', handleTimedeltaUpdate);
      }
      this.off('update', syncDeviceVolume);
      clearInterval(latencyInterval);
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
    const chunk = new Float32Array(data.chunk.buffer, data.chunk.byteOffset, data.chunk.byteLength / Float32Array.BYTES_PER_ELEMENT);
    const offset = data.i * OPUS_ENCODER_CHUNK_SAMPLES_COUNT * this.channels;
    this.buffer.set(chunk, offset);
  }

  setDelayFromLocalNow = () => {
    // we are not using this.latency here because this.latency is not always updated (if diff with previous value is small)
    // but here, we need the most precise measure of latency
    this.delayFromLocalNowBuffer[0] = this.pipedSource.peer.getCurrentTime()
      - this.pipedSource.startedAt
      - this.pipedSource.latency
      + (this.soundioOutputStream.getLatency() * 1000) - now();
  }

  toDescriptor = (sanitizeForConfigSave = false): AudioInstance<LocalDeviceSinkDescriptor> => ({
    type: this.type,
    name: this.name,
    uuid: this.uuid,
    deviceId: this.deviceId,
    pipedFrom: this.pipedFrom,
    volume: this.volume,
    ...(!sanitizeForConfigSave && {
      peerUuid: this.peerUuid,
      instanceUuid: this.instanceUuid,
      latency: this.latency,
      available: this.available,
    }),
  })
}
