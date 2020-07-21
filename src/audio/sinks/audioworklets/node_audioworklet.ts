import { AudioWorkletProcessor } from 'audioworklet';
import { OPUS_ENCODER_RATE } from '../../../utils/constants';
import { CircularTypedArray } from '../../../utils/circularTypedArray';
import { SynchronizedAudioBuffer } from '../../../utils/audio/synchronizedAudioBuffer';
import { now } from '../../../utils/misc';

class NodeAudioworklet extends AudioWorkletProcessor {
  buffer: CircularTypedArray<Float32Array>;
  synchronizedBuffer: SynchronizedAudioBuffer;
  delayFromLocalNowBuffer: Float64Array;
  channels: number;

  constructor() {
    super();

    this.port.onmessage = this.handleMessage_.bind(this);
  }

  getIdealAudioPosition = () => Math.floor((now() + this.delayFromLocalNowBuffer[0]) * (OPUS_ENCODER_RATE / 1000))

  handleMessage_(event) {
    if (event.data.type === 'buffer') {
      this.channels = event.data.channels;
      this.buffer = new CircularTypedArray(Float32Array, event.data.buffer);
      this.delayFromLocalNowBuffer = new Float64Array(event.data.delayFromLocalNowBuffer);
      this.synchronizedBuffer = new SynchronizedAudioBuffer(
        this.buffer,
        this.channels,
        this.getIdealAudioPosition,
        event.data.debug,
      );
    }
  }

  process(channels: Float32Array[]) {
    if (!this.synchronizedBuffer) {
      return true;
    }
    const samplesForCurrentFrame = this.synchronizedBuffer.readNextChunk(channels[0].length);
    let currentSampleIndexForCurrentFrame = 0;
    for (let sampleIndex = 0; sampleIndex < channels[0].length; sampleIndex++) {
      for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
        channels[channelIndex][sampleIndex] = samplesForCurrentFrame[currentSampleIndexForCurrentFrame];
        currentSampleIndexForCurrentFrame++;
      }
    }

    return true;
  }
}

export default NodeAudioworklet;
