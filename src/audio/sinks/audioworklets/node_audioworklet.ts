import { AudioWorkletProcessor } from 'audioworklet';
import { CircularTypedArray } from '../../../utils/circularTypedArray';
import { SynchronizedAudioBuffer } from '../../../utils/audio/synchronizedAudioBuffer';

class NodeAudioworklet extends AudioWorkletProcessor {
  buffer: CircularTypedArray<Float32Array>;
  synchronizedBuffer: SynchronizedAudioBuffer;
  audioClockDrift: Float64Array;
  channels: number;
  position = 0;

  constructor() {
    super();

    this.port.onmessage = this.handleMessage_.bind(this);
  }

  getIdealAudioPosition = () => this.audioClockDrift[0] + this.position

  handleMessage_(event) {
    if (event.data.type === 'buffer') {
      this.channels = event.data.channels;
      this.buffer = new CircularTypedArray(Float32Array, event.data.buffer);
      this.audioClockDrift = new Float64Array(event.data.audioClockDrift);
      this.synchronizedBuffer = new SynchronizedAudioBuffer(
        this.buffer,
        this.channels,
        this.getIdealAudioPosition,
        {
          debug: event.data.debug,
        },
      );
    }
  }

  process(channels: Float32Array[]) {
    if (this.synchronizedBuffer) {
      const samplesForCurrentFrame = this.synchronizedBuffer.readNextChunk(channels[0].length);
      let currentSampleIndexForCurrentFrame = 0;
      for (let sampleIndex = 0; sampleIndex < channels[0].length; sampleIndex++) {
        for (let channelIndex = 0; channelIndex < channels.length; channelIndex++) {
          channels[channelIndex][sampleIndex] = samplesForCurrentFrame[currentSampleIndexForCurrentFrame];
          currentSampleIndexForCurrentFrame++;
        }
      }
    }

    this.position += channels[0].length;
    return true;
  }
}

export default NodeAudioworklet;
