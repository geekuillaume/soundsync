import { CircularTypedArray } from './circularTypedArray';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_DURATION } from '../../../utils/constants';

const BUFFER_SIZE_IN_SECONDS = 10;
const CHANNELS = 2;
const BUFFER_SIZE = BUFFER_SIZE_IN_SECONDS * OPUS_ENCODER_RATE * CHANNELS;

// const formatNumber = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// @ts-ignore
class RawPcmPlayerProcessor extends AudioWorkletProcessor {
  chunkBuffer = new Float32Array(128 * CHANNELS);
  currentSampleIndex = 0;
  didFirstTimeSync = false;
  buffer = new CircularTypedArray(Float32Array, BUFFER_SIZE);

  port: MessagePort;

  constructor() {
    super();

    this.port.onmessage = this.handleMessage_.bind(this);
  }

  handleMessage_(event) {
    if (event.data.type === 'chunk') {
      const offset = event.data.i * OPUS_ENCODER_CHUNK_DURATION * (OPUS_ENCODER_RATE / 1000) * CHANNELS;
      this.buffer.set(event.data.chunk, offset);
      // console.log(`+ ${event.data.i} - ${formatNumber(offset)} -> ${formatNumber(offset + event.data.chunk.length)}`);
    }
    if (event.data.type === 'currentStreamTime') {
      this.didFirstTimeSync = true;
      this.currentSampleIndex = Math.floor(
        event.data.currentStreamTime
        * (OPUS_ENCODER_RATE / 1000)
        * CHANNELS,
      );
    }
  }

  process(inputs, outputs) {
    if (!this.didFirstTimeSync) {
      return true;
    }
    // console.log(`- ${formatNumber(this.currentSampleIndex)} -> ${formatNumber(this.currentSampleIndex + (outputs[0][0].length * 2))}`);
    // we cannot rely on the currentTime property to know which sample needs to be sent because
    // the precision is not high enough so we synchronize once the this.currentSampleIndex from the sourceTimeAtAudioTimeOrigin
    // message and then increase the currentSampleIndex everytime we output samples
    this.buffer.getInTypedArray(this.chunkBuffer, this.currentSampleIndex, outputs[0][0].length * CHANNELS);

    for (let sampleIndex = 0; sampleIndex < outputs[0][0].length; sampleIndex++) {
      outputs[0][0][sampleIndex] = this.chunkBuffer[sampleIndex * CHANNELS];
      outputs[0][1][sampleIndex] = this.chunkBuffer[sampleIndex * CHANNELS + 1];
      this.currentSampleIndex += CHANNELS;
    }

    return true;
  }
}

// @ts-ignore
registerProcessor('rawPcmPlayerProcessor', RawPcmPlayerProcessor);
