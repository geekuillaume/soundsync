
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
  // stores diff between ideal and actual buffer position
  // if is > 0 it means the audio device is going too fast
  private driftData: BasicNumericStatsTracker;
  private returnBuffer = Buffer.alloc(128 * Float32Array.BYTES_PER_ELEMENT * 2); // start with a reasonably large buffer that will be resized if necessary
  private typedReturnBuffer = new Float32Array(this.returnBuffer.buffer);
  private delayedDriftCorrection = 0;

  constructor(
    public buffer: CircularTypedArray<Float32Array>,
    public channels: number,
    public idealPositionPerChannelGetter: () => number,
    debug = false,
    driftHistorySize = 20,
  ) {
    // eslint-disable-next-line no-console
    this.log = debug ? console.log : () => null;
    this.driftData = new BasicNumericStatsTracker(driftHistorySize);
  }

  log: (str: string) => void;

  readNextChunk(chunkSizePerChannel: number) {
    const idealBufferPosition = this.idealPositionPerChannelGetter() * this.channels;
    let chunkDelta = 0;
    if (this.buffer.getReaderPointer() === 0) {
      this.buffer.setReaderPointer(idealBufferPosition);
    }
    // this.log(`= ideal position ${idealBufferPosition}, current position ${this.buffer.getReaderPointer()}, diff ${idealBufferPosition - this.buffer.getReaderPointer()}`);
    this.driftData.push(idealBufferPosition - this.buffer.getReaderPointer());
    if (this.delayedDriftCorrection) {
      chunkDelta = Math.floor(Math.min(chunkSizePerChannel * 0.02, Math.abs(this.delayedDriftCorrection) * 0.1)) * Math.sign(this.delayedDriftCorrection); // max 1% sample to remove or duplicate, or 10% of drift
      this.delayedDriftCorrection -= chunkDelta;
      if (chunkDelta === 0) {
        this.log(`====== finished delayed drift correction`);
        this.delayedDriftCorrection = 0;
        this.driftData.flush();
      }
    } else if (this.driftData.full()) {
      // we got enough data history about the drift to start making hard or soft resync if necessary
      const drift = this.driftData.mean();
      const driftDuration = drift / (OPUS_ENCODER_RATE / 1000) / this.channels;
      if (Math.abs(driftDuration) > HARD_SYNC_MIN_AUDIO_DRIFT) {
        // the drift is too important, this can happens in case the CPU was locked for a while (after suspending the device for example)
        // this will induce a audible glitch
        this.buffer.setReaderPointer(idealBufferPosition);
        this.driftData.flush();
        this.log(`====== hard sync: ${driftDuration}ms`);
      } else if (Math.abs(driftDuration) > SOFT_SYNC_MIN_AUDIO_DRIFT) {
        // we should be correcting for the drift but it's small enough that we can do this only by adding
        // or removing some samples in the output buffer
        // if drift is > 0, it means the audio device is going too fast
        // so we need to slow down the rate at which we read from the audio buffer to go back to the correct time
        chunkDelta = Math.floor(Math.min(chunkSizePerChannel * 0.02, Math.abs(drift) * 0.1)) * Math.sign(drift); // max 1% sample to remove or duplicate, or 10% of drift
        this.driftData.flush();
        this.delayedDriftCorrection = Math.floor((drift - chunkDelta) * 0.2);
        this.log(`====== soft sync: ${driftDuration}ms, chunk delta ${chunkDelta}, without limiting ${drift * 0.1}`);
      }
    }
    const chunkToReadByChannel = chunkSizePerChannel + chunkDelta;
    if (this.returnBuffer.byteLength !== chunkToReadByChannel * this.channels * Float32Array.BYTES_PER_ELEMENT) {
      this.returnBuffer = Buffer.alloc(chunkToReadByChannel * this.channels * Float32Array.BYTES_PER_ELEMENT);
      this.typedReturnBuffer = new Float32Array(this.returnBuffer.buffer);
    }
    this.buffer.getAtReaderPointerInTypedArray(this.typedReturnBuffer, chunkToReadByChannel * this.channels);
    const buffer = smartResizeAudioBuffer(
      this.typedReturnBuffer,
      chunkSizePerChannel,
      this.channels,
    );
    return buffer;
  }
}
