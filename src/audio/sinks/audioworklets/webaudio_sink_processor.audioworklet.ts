import { CircularTypedArray } from './circularTypedArray';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_SAMPLES_COUNT, MIN_AUDIODEVICE_CLOCK_SKEW_TO_RESYNC_AUDIO } from '../../../utils/constants';

const BUFFER_SIZE_IN_SECONDS = 10;
const CHANNELS = 2;
const BUFFER_SIZE = BUFFER_SIZE_IN_SECONDS * OPUS_ENCODER_RATE * CHANNELS;

declare const currentTime: number;
declare const currentFrame: number;
declare const sampleRate: number;

// const formatNumber = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// @ts-ignore
class RawPcmPlayerProcessor extends AudioWorkletProcessor {
  chunkBuffer = new Float32Array(128 * CHANNELS);
  currentSampleIndex = -1;
  receivedStreamTimeRelativeToContextTime = -1;
  buffer = new CircularTypedArray(Float32Array, BUFFER_SIZE);

  port: MessagePort;

  constructor() {
    super();
    this.port.onmessage = this.handleMessage_.bind(this);
  }

  handleMessage_(event) {
    if (event.data.type === 'chunk') {
      const offset = event.data.i * OPUS_ENCODER_CHUNK_SAMPLES_COUNT * CHANNELS;
      this.buffer.set(event.data.chunk, offset);
      // console.log(`+ ${event.data.i} - ${formatNumber(offset)} -> ${formatNumber(offset + event.data.chunk.length)}`);
    }
    if (event.data.type === 'currentStreamTime') {
      // console.log('Received at', currentTime * 1000);
      // we cannot set the currentSampleIndex directly here as the process function can be delayed for +200ms by the browser
      this.receivedStreamTimeRelativeToContextTime = event.data.currentStreamTimeRelativeToContextTime;
    }
  }

  process(inputs, outputs) {
    if (this.receivedStreamTimeRelativeToContextTime !== -1) {
      // console.log('Processed at', currentTime * 1000);
      const targetCurrentSampleIndex = Math.floor(
        (this.receivedStreamTimeRelativeToContextTime + (currentTime * 1000))
        * (OPUS_ENCODER_RATE / 1000),
      ) * CHANNELS;
      const skewSampleCount = this.currentSampleIndex - targetCurrentSampleIndex;
      const skewDuration = skewSampleCount / CHANNELS / (OPUS_ENCODER_RATE / 1000);
      // only reset currentSampleIndex if the skew is too high, this prevent the audio from resetting
      // too aggressivly and so leading to a choppy audio
      if (Math.abs(skewDuration) > MIN_AUDIODEVICE_CLOCK_SKEW_TO_RESYNC_AUDIO) {
        // console.log(`Resync, skew was ${skewDuration.toFixed(3)}ms - ${skewSampleCount / CHANNELS} samples`);
        this.currentSampleIndex = targetCurrentSampleIndex;
      }

      this.receivedStreamTimeRelativeToContextTime = -1;
    }
    if (this.currentSampleIndex === -1) {
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
