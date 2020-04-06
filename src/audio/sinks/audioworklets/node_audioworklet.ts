import _ from 'lodash';
import { AudioWorkletProcessor } from 'audioworklet';
import { CircularTypedArray } from './circularTypedArray';

class NodeAudioworklet extends AudioWorkletProcessor {
  buffer: CircularTypedArray<Float32Array>;

  constructor() {
    super();

    this.port.onmessage = this.handleMessage_.bind(this);
  }

  handleMessage_(event) {
    if (event.data.type === 'buffer') {
      this.buffer = new CircularTypedArray(Float32Array, event.data.buffer);
      this.buffer.setPointersBuffer(event.data.pointersBuffer);
    }
  }

  process(channels: Float32Array[]) {
    if (!this.buffer) {
      return true;
    }
    // we cannot rely on the currentTime property to know which sample needs to be sent because
    // the precision is not high enough so we synchronize once the this.currentSampleIndex from the sourceTimeAtAudioTimeOrigin
    // message and then increase the currentSampleIndex everytime we output samples
    const [samplesForCurrentFrame, offset] = this.buffer.getAtReaderPointer(_.sum(channels.map((c) => c.length)));
    let currentSampleIndexForCurrentFrame = 0;

    for (let sampleIndex = 0; sampleIndex < channels[0].length; sampleIndex++) {
      for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
        channels[channelIndex][sampleIndex] = samplesForCurrentFrame[currentSampleIndexForCurrentFrame];
        currentSampleIndexForCurrentFrame++;
      }
    }
    this.buffer.fill(offset, samplesForCurrentFrame.length, 0);

    return true;
  }
}

export default NodeAudioworklet;
