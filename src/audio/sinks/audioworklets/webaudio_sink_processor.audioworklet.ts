import { CircularTypedArray } from '../../../utils/circularTypedArray';
import { OPUS_ENCODER_RATE, MAX_LATENCY } from '../../../utils/constants';

const CHANNELS = 2;
const BUFFER_SIZE = MAX_LATENCY * (OPUS_ENCODER_RATE / 1000) * CHANNELS;

declare const currentTime: number;
declare const currentFrame: number;
declare const sampleRate: number;

// const formatNumber = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// @ts-ignore
class RawPcmPlayerProcessor extends AudioWorkletProcessor {
  chunkBuffer = new Float32Array(128 * CHANNELS);
  buffer = new CircularTypedArray(Float32Array, BUFFER_SIZE);

  port: MessagePort;

  constructor() {
    super();
    this.port.onmessage = this.handleMessage_.bind(this);
  }

  handleMessage_(event) {
    if (event.data.type === 'chunk') {
      this.buffer.set(event.data.chunk, event.data.timestamp * CHANNELS);
    }
  }

  process(inputs, outputs) {
    this.buffer.getInTypedArray(this.chunkBuffer, currentFrame * CHANNELS, this.chunkBuffer.length);

    for (let sampleIndex = 0; sampleIndex < outputs[0][0].length; sampleIndex++) {
      outputs[0][0][sampleIndex] = this.chunkBuffer[sampleIndex * CHANNELS];
      outputs[0][1][sampleIndex] = this.chunkBuffer[sampleIndex * CHANNELS + 1];
    }

    return true;
  }
}

// @ts-ignore
registerProcessor('rawPcmPlayerProcessor', RawPcmPlayerProcessor);
