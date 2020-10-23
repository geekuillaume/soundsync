import { AudioServer, AudioStream } from 'audioworklet';

import debug from '../../utils/environment/log';
import { AudioChunkStreamOutput } from '../../utils/audio/chunk_stream';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import {
  OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_SAMPLES_COUNT,
} from '../../utils/constants';
import { LocalDeviceSinkDescriptor } from './sink_type';
import { getOutputDeviceFromId, getAudioServer } from '../../utils/audio/localAudioDevice';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { AudioInstance } from '../utils';
import { NumericStatsTracker } from '../../utils/basicNumericStatsTracker';
import { remapChannels } from '../../utils/audio/audio-utils';
import { DriftAwareAudioBufferTransformer } from '../../utils/audio/synchronizedAudioBuffer';

const AUDIO_DRIFT_HISTORY_INTERVAL = 50;
const AUDIO_DRIFT_HISTORY_DURATION = 2 * 60 * 1000;

export class LocalDeviceSink extends AudioSink {
  type: 'localdevice' = 'localdevice';
  local: true = true;
  deviceId: string;
  audioClockDriftHistory = new NumericStatsTracker<number>((v) => v, AUDIO_DRIFT_HISTORY_DURATION / AUDIO_DRIFT_HISTORY_INTERVAL);

  private cleanStream: () => void;
  private audioStream: AudioStream;
  private audioBufferTransformer: DriftAwareAudioBufferTransformer;

  constructor(descriptor: LocalDeviceSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.deviceId = descriptor.deviceId;
    this.available = false; // device is considered not available at first before this.updateDeviceInfo
    this.updateDeviceInfo();
    setInterval(this.updateDeviceInfo, 5000);
  }

  isDeviceAvailable = () => !!getOutputDeviceFromId(this.deviceId)
  private updateDeviceInfo = () => {
    this.updateInfo({
      available: this.isDeviceAvailable(),
    });
  }

  async _startSink(source: AudioSource) {
    this.log(`Starting localdevice sink`);
    const device = getOutputDeviceFromId(this.deviceId);
    this.channels = Math.min(device.maxChannels, 2);
    this.audioStream = getAudioServer().initOutputStream(this.deviceId, {
      sampleRate: OPUS_ENCODER_RATE,
      name: source.name,
      format: AudioServer.F32LE,
      channels: this.channels,
    });
    this.audioBufferTransformer = new DriftAwareAudioBufferTransformer(
      this.channels,
      () => this.audioClockDriftHistory.mean(),
    );

    this.updateInfo({ latency: device.minLatency });
    this.registerDrift();

    const flushDriftHistory = () => {
      // in some situation (audio source latency change, peer timedelta big change), we flush the drift history so that we can correct quickly for this change
      this.audioBufferTransformer.ignoreDriftFor = 0;
      this.audioClockDriftHistory.flush();
    };
    // we keep a reference here instead of using this.pipedSource to always be able remove the event listeners in the clean stream
    const pipedSource = this.pipedSource;
    const sourcePeer = this.pipedSource.peer;
    sourcePeer.on('timedeltaUpdated', flushDriftHistory);
    pipedSource.on('update', flushDriftHistory);
    const syncDeviceVolume = () => {
      if (this.audioStream) {
        this.audioStream.setVolume(this.volume);
      }
    };
    this.on('update', syncDeviceVolume);
    const driftRegisterInterval = setInterval(this.registerDrift, AUDIO_DRIFT_HISTORY_INTERVAL);
    this.cleanStream = () => {
      sourcePeer.off('timedeltaUpdated', flushDriftHistory);
      pipedSource.off('update', flushDriftHistory);
      this.off('update', syncDeviceVolume);
      clearInterval(driftRegisterInterval);
      this.audioStream.stop();
      this.audioClockDriftHistory.flush();
      delete this.audioStream;
      delete this.cleanStream;
    };
    this.audioStream.start();
  }

  _stopSink() {
    if (this.cleanStream) {
      this.cleanStream();
    }
  }

  handleAudioChunk = (data: AudioChunkStreamOutput, outOfOrder: boolean) => {
    if (!this.audioStream) {
      return;
    }
    if (!this.pipedSource || !this.pipedSource.peer) {
      this.log(`Received a chunk for a not piped sink, ignoring`);
      return;
    }
    const chunk = remapChannels(new Float32Array(data.chunk.buffer, data.chunk.byteOffset, data.chunk.byteLength / Float32Array.BYTES_PER_ELEMENT), this.pipedSource.channels, this.channels);
    if (outOfOrder) {
      this.audioBufferTransformer.ignoreDriftFor = 0;
    }
    const { bufferTimestamp, buffer } = this.audioBufferTransformer.transformChunk(chunk, (data.i * OPUS_ENCODER_CHUNK_SAMPLES_COUNT));

    const bufferTimestampDelta = ((bufferTimestamp - this.audioStream.getPosition()) / this.rate) * 1000;
    if (bufferTimestampDelta < 0 || bufferTimestampDelta > this.latency + this.latencyCorrection + 1000) {
      // if we are trying to push a buffer already in the past or too far in the future, do nothing
      return;
    }

    try {
      this.audioStream.pushAudioChunk(bufferTimestamp, buffer);
    } catch (e) {
      // in case of a hard sync, we can have a buffer added to the queue before a previously pushed buffer
      // we ignore this error
    }
  }

  registerDrift = () => {
    const audioClockDrift = (this.audioStream.getPosition()) - (( // ideal position
      this.pipedSource.peer.getCurrentTime(true)
        - this.pipedSource.startedAt
        - this.pipedSource.latency
        + this.latencyCorrection
    ) * (this.rate / 1000));
    this.audioClockDriftHistory.push(audioClockDrift);
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
