import SoxrResampler, { SoxrDatatype } from 'wasm-audio-resampler';
import { AudioError } from '../../utils/misc';
import { AudioInstance } from '../utils';
import {
  OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_SAMPLES_COUNT,
} from '../../utils/constants';
import { AirplaySinkDescriptor } from './sink_type';
import { AudioSink } from './audio_sink';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { AudioChunkStreamOutput } from '../../utils/audio/chunk_stream';
import { AirplaySpeaker } from '../../utils/vendor_integrations/airplay/airplaySpeaker';
import { SAMPLE_RATE, CHANNELS } from '../../utils/vendor_integrations/airplay/airplayConstants';

export class AirplaySink extends AudioSink {
  local: true = true;
  type: 'airplay' = 'airplay';

  latency = 1000;
  host: string;
  port: number;
  private airplay: AirplaySpeaker;
  private resampler: SoxrResampler;
  private cleanAirplay: () => Promise<void>;

  constructor(descriptor: AirplaySinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.host = descriptor.host;
    this.port = descriptor.port;
  }

  async _startSink() {
    this.log('Connecting to Airplay sink');
    this.airplay = new AirplaySpeaker(
      this.host,
      this.port,
      this.getCurrentStreamTime,
      this.latency,
    );
    const resampler = new SoxrResampler(CHANNELS, OPUS_ENCODER_RATE, SAMPLE_RATE, SoxrDatatype.SOXR_FLOAT32, SoxrDatatype.SOXR_INT16);
    await resampler.init();
    // only set it once it's ready to use to prevent handleAudioChunk from calling it before being initialized
    this.resampler = resampler;
    try {
      await this.airplay.start();
    } catch (e) {
      if (e.errno === 'ECONNREFUSED') {
        throw new AudioError('Airplay speaker not found', e);
      }
      throw new AudioError('Unknown error', e);
    }

    const updateHandler = () => {
      this.airplay.setVolume(this.volume);
    };
    this.on('update', updateHandler);
    // do it once to synchronize airplay state with current state
    updateHandler();

    this.cleanAirplay = async () => {
      this.off('update', updateHandler);
      await this.airplay.stop();
      delete this.airplay;
      delete this.resampler;
      delete this.cleanAirplay;
    };
  }

  _stopSink = async () => {
    if (this.cleanAirplay) {
      await this.cleanAirplay();
    }
  }

  handleAudioChunk = (data: AudioChunkStreamOutput, outOfOrder: boolean) => {
    if (!this.resampler) {
      return;
    }
    const resampled = this.resampler.processChunk(data.chunk);
    if (!resampled.length) {
      return;
    }
    if (outOfOrder || this.airplay.lastSentSampleTimestamp === -1) {
      this.airplay.setPushTimestamp(data.i * OPUS_ENCODER_CHUNK_SAMPLES_COUNT);
    }
    this.airplay.pushAudioChunk(new Int16Array(resampled.buffer, resampled.byteOffset, resampled.byteLength / Int16Array.BYTES_PER_ELEMENT));
  }

  toDescriptor = (sanitizeForConfigSave = false): AudioInstance<AirplaySinkDescriptor> => ({
    type: this.type,
    name: this.name,
    uuid: this.uuid,
    pipedFrom: this.pipedFrom,
    volume: this.volume,
    latencyCorrection: this.latencyCorrection,

    host: this.host,
    port: this.port,
    ...(!sanitizeForConfigSave && {
      peerUuid: this.peerUuid,
      instanceUuid: this.instanceUuid,
      latency: this.latency,
      available: this.available,
      error: this.error,
    }),
  })
}
