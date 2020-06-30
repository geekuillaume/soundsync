
// This class handle an audio buffer and is tasked with outputting the right audio buffer
// at the right time for the audio output device
// It  will hard or soft sync depending on the clock drift between the audio device and the ideal time

import { CircularTypedArray } from './circularTypedArray';
import { BasicNumericStatsTracker } from './basicNumericStatsTracker';
import { HARD_SYNC_MIN_AUDIO_DRIFT, SOFT_SYNC_MIN_AUDIO_DRIFT, OPUS_ENCODER_RATE } from './constants';

// this method handle an audio buffer and will resize it to the target length by either
// dropping samples if the source buffer is too big or duplicating samples if the source buffer is too small
const smartResizeAudioBuffer = (buffer: Float32Array, targetSamplesPerChannel: number, channels: number) => {
  const sourceBufferSamplesPerChannels = buffer.length / channels;
  const samplesPerChannelsDiff = sourceBufferSamplesPerChannels - targetSamplesPerChannel; // 3
  if (samplesPerChannelsDiff === 0) {
    return buffer;
  }
  const resizedBuffer = new Float32Array(targetSamplesPerChannel * channels); // 125 * 2 = 250
  // we create buffer slices and we remove or duplicate one sample per channel at the end of each slice
  const sliceLength = sourceBufferSamplesPerChannels / Math.abs(samplesPerChannelsDiff); // 86
  const sampleDeltaPerSlice = samplesPerChannelsDiff > 0 ? -1 : 1;
  for (let i = 0; i < Math.abs(samplesPerChannelsDiff); i++) {
    const sourceSliceStart = Math.floor(i * sliceLength) * channels;
    const sourceSliceEnd = Math.floor(((i + 1) * sliceLength) + sampleDeltaPerSlice) * channels;
    const targetOffset = Math.floor(i * (sliceLength + sampleDeltaPerSlice)) * channels;
    resizedBuffer.set(
      buffer.slice(sourceSliceStart, sourceSliceEnd),
      targetOffset,
    );
  }
  if (sampleDeltaPerSlice > 0) {
    // if we are increasing the size of the buffer, the last [channels] samples will be 0 because we tried to read
    // after the end of the source buffer so we need to copy the [channels] samples back at the end
    resizedBuffer.set(
      buffer.slice(buffer.length - channels),
      resizedBuffer.length - channels,
    );
  }
  return resizedBuffer;
};

export class SynchronizedAudioBuffer {
  currentBufferReadPosition = 0;
  // stores diff between ideal and actual buffer position
  // if is > 0 it means the audio device is going too fast
  private driftData = new BasicNumericStatsTracker(20);

  constructor(
    public buffer: CircularTypedArray<Float32Array>,
    public channels: number,
    public idealPositionPerChannelGetter: () => number,
    debug = false,
  ) {
    // eslint-disable-next-line no-console
    this.log = debug ? console.log : () => null;
  }

  log: (str: string) => void;

  readNextChunk(chunkSizePerChannel: number) {
    const idealBufferPosition = this.idealPositionPerChannelGetter() * this.channels;
    let rateMultiplicator = 1;
    if (this.currentBufferReadPosition === 0) {
      this.currentBufferReadPosition = idealBufferPosition;
    }
    this.driftData.push(idealBufferPosition - this.currentBufferReadPosition);
    if (this.driftData.full()) {
      // we got enough data history about the drift to start making hard or soft resync if necessary
      const drift = this.driftData.mean() / (OPUS_ENCODER_RATE / 1000);
      if (Math.abs(drift) > HARD_SYNC_MIN_AUDIO_DRIFT) {
        // the drift is too important, this can happens in case the CPU was locked for a while (after suspending the device for example)
        // this will induce a audible glitch
        this.currentBufferReadPosition = idealBufferPosition;
        this.driftData.flush();
        this.log(`====== hard sync: ${drift}ms`);
      } else if (Math.abs(drift) > SOFT_SYNC_MIN_AUDIO_DRIFT) {
        // we should be correcting for the drift but it's small enough that we can do this only by adding
        // or removing some samples in the output buffer
        // if drift is > 0, it means the audio device is going too fast
        // so we need to slow down the rate at which we read from the audio buffer to go back to the correct time
        rateMultiplicator = drift < 0 ? 0.998 : 1.002;
        this.log(`====== soft sync: ${drift}ms, chunk delta ${chunkSizePerChannel * (1 - rateMultiplicator)}`);
      }
    }
    const chunkToReadByChannel = Math.floor(chunkSizePerChannel * rateMultiplicator);
    const buffer = smartResizeAudioBuffer(
      this.buffer.get(this.currentBufferReadPosition, chunkToReadByChannel * this.channels),
      chunkSizePerChannel,
      this.channels,
    );
    this.currentBufferReadPosition += chunkToReadByChannel * this.channels;
    return buffer;
  }
}
