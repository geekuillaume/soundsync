import { CircularTypedArray } from '../../../utils/circularTypedArray';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_SAMPLES_COUNT, MAX_LATENCY } from '../../../utils/constants';
import { SynchronizedAudioBuffer } from '../../../utils/audio/synchronizedAudioBuffer';

const CHANNELS = 2;
const BUFFER_SIZE = MAX_LATENCY * (OPUS_ENCODER_RATE / 1000) * CHANNELS;

const DRIFT_HISTORY_TIME_PERIOD = 10 * 1000; // 10s drift history necessary before taking action (soft or hard sync)
const DRIFT_HISTORY_SIZE = Math.floor(DRIFT_HISTORY_TIME_PERIOD / (128 / OPUS_ENCODER_RATE) / 1000);

declare const currentTime: number;
declare const currentFrame: number;
declare const sampleRate: number;

// const formatNumber = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// @ts-ignore
class RawPcmPlayerProcessor extends AudioWorkletProcessor {
  chunkBuffer = new Float32Array(128 * CHANNELS);
  currentSampleIndex = -1;
  buffer = new CircularTypedArray(Float32Array, BUFFER_SIZE);
  synchronizedBuffer: SynchronizedAudioBuffer;
  lastReceivedStreamTime = -1;
  currentTimeRelativeToAudioContext = -1;

  port: MessagePort;

  constructor() {
    super();
    this.port.onmessage = this.handleMessage_.bind(this);
  }

  handleMessage_(event) {
    if (event.data.type === 'init') {
      this.synchronizedBuffer = new SynchronizedAudioBuffer(this.buffer, CHANNELS, this.getIdealAudioPosition, event.data.debug, DRIFT_HISTORY_SIZE);
    }
    if (event.data.type === 'chunk') {
      const offset = event.data.i * OPUS_ENCODER_CHUNK_SAMPLES_COUNT * CHANNELS;
      this.buffer.set(event.data.chunk, offset);
      this.currentTimeRelativeToAudioContext = event.data.currentTimeRelativeToAudioContext;
      // console.log(`+ ${event.data.i} - ${formatNumber(offset)} -> ${formatNumber(offset + event.data.chunk.length)}`);
    }
  }

  getIdealAudioPosition = () => Math.floor((this.currentTimeRelativeToAudioContext + (currentTime * 1000)) * (OPUS_ENCODER_RATE / 1000))

  process(inputs, outputs) {
    if (!this.synchronizedBuffer || this.currentTimeRelativeToAudioContext === -1) {
      return true;
    }
    const chunkBuffer = this.synchronizedBuffer.readNextChunk(outputs[0][0].length);

    for (let sampleIndex = 0; sampleIndex < outputs[0][0].length; sampleIndex++) {
      outputs[0][0][sampleIndex] = chunkBuffer[sampleIndex * CHANNELS];
      outputs[0][1][sampleIndex] = chunkBuffer[sampleIndex * CHANNELS + 1];
    }

    return true;
  }
}

// @ts-ignore
registerProcessor('rawPcmPlayerProcessor', RawPcmPlayerProcessor);
