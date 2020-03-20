import { AudioWorkletProcessor } from 'audioworklet';
import { CircularTypedArray } from './circularTypedArray';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_DURATION } from '../../../utils/constants';

const BUFFER_SIZE_IN_SECONDS = 10;
const CHANNELS = 2;
const BUFFER_SIZE = BUFFER_SIZE_IN_SECONDS * OPUS_ENCODER_RATE * CHANNELS;

// const formatNumber = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
class RtAudioWorklet extends AudioWorkletProcessor {
  buffer = new CircularTypedArray(Int16Array, BUFFER_SIZE);
  didFirstTimeSync = false;
  currentSampleIndex = 0;

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
    if (event.data.type === 'currentChunkIndex') {
      this.didFirstTimeSync = true;
      this.currentSampleIndex = Math.floor(
        event.data.currentChunkIndex
        * OPUS_ENCODER_CHUNK_DURATION
        * (OPUS_ENCODER_RATE / 1000)
        * CHANNELS,
      );
    }
  }

  process(inputs: Buffer[], outputs: Buffer[]) {
    if (!this.didFirstTimeSync) {
      return true;
    }
    // console.log(`- ${formatNumber(this.currentSampleIndex)} -> ${formatNumber(this.currentSampleIndex + (outputs[0].length))}`);
    const typedOutputBuffer = new Int16Array(outputs[0].buffer);

    // we cannot rely on the currentTime property to know which sample needs to be sent because
    // the precision is not high enough so we synchronize once the this.currentSampleIndex from the sourceTimeAtAudioTimeOrigin
    // message and then increase the currentSampleIndex everytime we output samples
    this.buffer.getInTypedArray(typedOutputBuffer, this.currentSampleIndex, typedOutputBuffer.length);
    this.currentSampleIndex += typedOutputBuffer.length;

    return true;
  }
}

export default RtAudioWorklet;
