import _ from 'lodash';
import { AudioWorkletProcessor } from 'audioworklet';
import { CircularTypedArray } from './circularTypedArray';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_DURATION } from '../../../utils/constants';

const BUFFER_SIZE_IN_SECONDS = 10;
const CHANNELS = 2;
const BUFFER_SIZE = BUFFER_SIZE_IN_SECONDS * OPUS_ENCODER_RATE * CHANNELS;

// const formatNumber = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
class NodeAudioworklet extends AudioWorkletProcessor {
  buffer = new CircularTypedArray(Float32Array, BUFFER_SIZE);
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
    if (event.data.type === 'currentStreamTime') {
      this.didFirstTimeSync = true;
      this.currentSampleIndex = Math.floor(
        event.data.currentStreamTime
        * (OPUS_ENCODER_RATE / 1000)
        * CHANNELS,
      );
    }
  }

  process(channels: Float32Array[]) {
    if (!this.didFirstTimeSync) {
      return true;
    }
    // console.log(`- ${formatNumber(this.currentSampleIndex)} -> ${formatNumber(this.currentSampleIndex + (outputs[0].length))}`);
    // we cannot rely on the currentTime property to know which sample needs to be sent because
    // the precision is not high enough so we synchronize once the this.currentSampleIndex from the sourceTimeAtAudioTimeOrigin
    // message and then increase the currentSampleIndex everytime we output samples
    const samplesForCurrentFrame = this.buffer.get(this.currentSampleIndex, _.sum(channels.map((c) => c.length)));
    let currentSampleIndexForCurrentFrame = 0;

    for (let sampleIndex = 0; sampleIndex < channels[0].length; sampleIndex++) {
      for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
        channels[channelIndex][sampleIndex] = samplesForCurrentFrame[currentSampleIndexForCurrentFrame];
        currentSampleIndexForCurrentFrame++;
      }
    }
    this.buffer.fill(this.currentSampleIndex, samplesForCurrentFrame.length, 0);
    this.currentSampleIndex += currentSampleIndexForCurrentFrame;

    return true;
  }
}

export default NodeAudioworklet;
