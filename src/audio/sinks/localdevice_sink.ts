import { Worker } from 'worker_threads';
import { AudioServer, AudioStream } from 'audioworklet';

import { resolve } from 'path';
import debug from 'debug';
import { now } from '../../utils/misc';
import { AudioChunkStreamOutput } from '../../utils/audio/chunk_stream';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import {
  OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_SAMPLES_COUNT, MAX_LATENCY,
} from '../../utils/constants';
import { LocalDeviceSinkDescriptor } from './sink_type';
import { getOutputDeviceFromId, getAudioServer } from '../../utils/audio/localAudioDevice';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { AudioInstance } from '../utils';
import { CircularTypedArray } from '../../utils/circularTypedArray';
import { NumericStatsTracker } from '../../utils/basicNumericStatsTracker';

const AUDIO_DRIFT_HISTORY_INTERVAL = 50;
const AUDIO_DRIFT_HISTORY_DURATION = 2 * 60 * 1000;

export class LocalDeviceSink extends AudioSink {
  type: 'localdevice' = 'localdevice';
  local: true = true;
  deviceId: string;
  buffer: CircularTypedArray<Float32Array>;
  audioClockDrift = new Float64Array(new SharedArrayBuffer(Float64Array.BYTES_PER_ELEMENT));
  audioClockDriftHistory = new NumericStatsTracker<number>((v) => v, AUDIO_DRIFT_HISTORY_DURATION / AUDIO_DRIFT_HISTORY_INTERVAL);

  private worklet: Worker;
  private cleanStream;
  private audioStream: AudioStream;

  constructor(descriptor: LocalDeviceSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.deviceId = descriptor.deviceId;
    this.available = false; // device is considered not available at first before this.updateDeviceInfo
    this.updateDeviceInfo();
    setInterval(this.updateDeviceInfo, 5000);
  }

  isDeviceAvailable = async () => !!(await getOutputDeviceFromId(this.deviceId))
  private updateDeviceInfo = async () => {
    this.updateInfo({
      available: await this.isDeviceAvailable(),
    });
  }

  async _startSink(source: AudioSource) {
    this.log(`Creating speaker`);
    await source.peer.waitForFirstTimeSync();
    const device = getOutputDeviceFromId(this.deviceId);
    this.channels = Math.min(device.maxChannels, 2);
    this.audioStream = getAudioServer().initOutputStream(this.deviceId, {
      sampleRate: OPUS_ENCODER_RATE,
      name: source.name,
      format: AudioServer.F32LE,
      channels: this.channels,
    });
    this.worklet = this.audioStream.attachProcessFunctionFromWorker(resolve(__dirname, './audioworklets/node_audioworklet.js'));
    this.audioStream.start();

    const bufferSize = MAX_LATENCY * (OPUS_ENCODER_RATE / 1000) * this.channels * Float32Array.BYTES_PER_ELEMENT;
    const bufferData = new SharedArrayBuffer(bufferSize);
    this.buffer = new CircularTypedArray(Float32Array, bufferData);
    this.updateInfo({ latency: device.minLatency });
    this.registerDrift();
    this.worklet.postMessage({
      type: 'buffer',
      buffer: bufferData,
      audioClockDrift: this.audioClockDrift.buffer,
      channels: this.channels,
      debug: debug.enabled('soundsync:audioSinkDebug'),
    });

    const handleTimedeltaUpdate = () => {
      this.log(`Resynchronizing sink after update from timedelta with peer or source latency`);
      this.registerDrift();
    };
    this.pipedSource.peer.on('timedeltaUpdated', handleTimedeltaUpdate);
    // this is needed to resync the audioworklet when the source latency is updated
    this.pipedSource.on('update', handleTimedeltaUpdate);
    const syncDeviceVolume = () => {
      this.audioStream.setVolume(this.volume);
    };
    this.on('update', syncDeviceVolume);
    const driftRegisterInterval = setInterval(this.registerDrift, AUDIO_DRIFT_HISTORY_INTERVAL);
    this.cleanStream = () => {
      if (this.pipedSource.peer) {
        this.pipedSource.peer.off('timedeltaUpdated', handleTimedeltaUpdate);
      }
      if (this.pipedSource) {
        this.pipedSource.off('update', handleTimedeltaUpdate);
      }
      this.off('update', syncDeviceVolume);
      this.audioStream.stop();
      clearInterval(driftRegisterInterval);
      delete this.audioStream;
      delete this.audioStream;
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
    if (this.channels === 1 && this.pipedSource.channels === 2) { // TODO: handle all possible combo of channels
      // remap stero to mono by taking the mean value of both channels samples
      for (let sample = 0; sample < OPUS_ENCODER_CHUNK_SAMPLES_COUNT; sample++) {
        chunk[sample] = (chunk[(sample * this.pipedSource.channels)] + chunk[(sample * this.pipedSource.channels) + 1]) / 2;
      }
      this.buffer.set(new Float32Array(chunk.buffer, chunk.byteOffset, OPUS_ENCODER_CHUNK_SAMPLES_COUNT), offset);
    } else {
      this.buffer.set(chunk, offset);
    }
  }

  registerDrift = () => {
    const audioClockDrift = (( // ideal position
      this.pipedSource.peer.getCurrentTime(true)
        - this.pipedSource.startedAt
        - this.pipedSource.latency
        + this.latencyCorrection
    ) * (this.rate / 1000)) - (this.audioStream.getPosition());
    this.audioClockDriftHistory.push(audioClockDrift);
    this.audioClockDrift[0] = this.audioClockDriftHistory.mean();
  }

  toDescriptor = (sanitizeForConfigSave = false): AudioInstance<LocalDeviceSinkDescriptor> => ({
    type: this.type,
    name: this.name,
    uuid: this.uuid,
    deviceId: this.deviceId,
    pipedFrom: this.pipedFrom,
    volume: this.volume,
    latencyCorrection: this.latencyCorrection,

    ...(!sanitizeForConfigSave && {
      peerUuid: this.peerUuid,
      instanceUuid: this.instanceUuid,
      latency: this.latency,
      available: this.available,
      error: this.error,
    }),
  })
}
