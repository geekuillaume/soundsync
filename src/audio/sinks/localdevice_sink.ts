import { AudioServer, AudioStream } from 'audioworklet';

import debug from '../../utils/environment/log';
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
      // special check for rapsberry pi as the default audio output is "lying" about its minimum latency and so we need to set a 150ms fixed latency to prevent underrun
      latencyFrames: device.id.includes('bcm2835_audio') ? (OPUS_ENCODER_RATE / 1000) * 150 : undefined,
    });
    this.audioBufferTransformer = new DriftAwareAudioBufferTransformer(
      this.channels,
      // if latencyCorrection is >0 it means we need to send samples [latencyCorrection]ms early to compensate for the additionnal delay
      () => Math.floor(this.audioClockDriftHistory.mean()) + (this.latencyCorrection * (this.rate / 1000)),
    );

    this.updateInfo({ latency: this.audioStream.configuredLatencyFrames / (this.rate / 1000) });
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
    const chunk = remapChannels(new Float32Array(data.chunk.buffer, data.chunk.byteOffset, data.chunk.byteLength / Float32Array.BYTES_PER_ELEMENT), this.pipedSource.channels, this.channels);
    if (outOfOrder) {
      this.audioBufferTransformer.ignoreDriftFor = 0;
    }
    const { bufferTimestamp, buffer } = this.audioBufferTransformer.transformChunk(chunk, (data.i * OPUS_ENCODER_CHUNK_SAMPLES_COUNT));

    const bufferTimestampDelta = ((bufferTimestamp - this.audioStream.getPosition()) / this.rate) * 1000;
    if (bufferTimestampDelta < 0 || bufferTimestampDelta > MAX_LATENCY) {
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
    const deviceTime = (this.audioStream.getPosition() / (this.rate / 1000));
    const streamTime = this.pipedSource.peer.getCurrentTime(true)
      - this.pipedSource.startedAt
      - this.pipedSource.latency;
    const audioClockDrift = (deviceTime - streamTime) * (this.rate / 1000);
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

  _additionalDebugInfo = () => ({
    audioClockDriftHistoryLength: this.audioClockDriftHistory.length(),
    audioClockDriftHistoryStdDev: this.audioClockDriftHistory.standardDeviation(),
    audioClockCurrentDrift: this.audioStream && ((this.audioStream.getPosition()) - ((
      this.pipedSource.peer.getCurrentTime(true)
        - this.pipedSource.startedAt
        - this.pipedSource.latency
        + this.latencyCorrection
    ) * (this.rate / 1000))),
  })
}
