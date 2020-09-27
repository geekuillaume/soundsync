// This class handle an audio buffer and is tasked with outputting the right audio buffer
// at the right time for the audio output device
// It  will hard or soft sync depending on the clock drift between the audio device and the ideal time

import { CircularTypedArray } from '../circularTypedArray';
import { HARD_SYNC_MIN_AUDIO_DRIFT, SOFT_SYNC_MIN_AUDIO_DRIFT, OPUS_ENCODER_RATE } from '../constants';

const DRIFT_CORRECTION_MIN_INTERVAL = OPUS_ENCODER_RATE * 5; // force minimum 5 seconds between each latency correction

// this method handle an audio buffer and will resize it to the target length by either
// dropping samples if the source buffer is too big or duplicating samples if the source buffer is too small
const smartResizeAudioBuffer = (buffer: Float32Array, targetSamplesPerChannel: number, channels: number) => {
  const sourceBufferSamplesPerChannels = buffer.length / channels;
  const samplesPerChannelsDiff = sourceBufferSamplesPerChannels - targetSamplesPerChannel;
  if (samplesPerChannelsDiff === 0) {
    return buffer;
  }
  const resizedBuffer = new Float32Array(targetSamplesPerChannel * channels);
  // we create buffer slices and we remove or duplicate one sample per channel at the end of each slice
  const sliceLength = sourceBufferSamplesPerChannels / Math.abs(samplesPerChannelsDiff);
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

export class DriftAwareAudioBufferTransformer {
  public softSyncThreshold: number;
  public hardSyncThreshold: number;
  private log: (str: string) => void;
  /** Represent the last written sample timestamp + 1 */
  public nextWrittenSampleTimestamp = -1;
  /** Number of samples to add or remove in the next received audio chunks to handle drift between audio and system clock */
  private delayedDriftCorrection = 0;
  /** number of samples to wait until starting to correct for drift again, used to prevent over correction */
  public ignoreDriftFor = 0;

  constructor(
    public channels: number,
    /** Diff between the chunk timestamp and the return buffer timestamp = delta between audio source clock and audio device clock */
    public chunkTimestampIdealDriftGetter: () => number,
    {
      debug = false,
      softSyncThreshold = SOFT_SYNC_MIN_AUDIO_DRIFT,
      hardSyncThreshold = HARD_SYNC_MIN_AUDIO_DRIFT,
    } = {},
  ) {
    // eslint-disable-next-line no-console
    this.log = debug ? console.log : () => null;
    this.softSyncThreshold = softSyncThreshold;
    this.hardSyncThreshold = hardSyncThreshold;
  }

  transformChunk(chunk: Float32Array, chunkTimestamp: number) {
    const idealPosition = this.chunkTimestampIdealDriftGetter() + chunkTimestamp;
    if (this.nextWrittenSampleTimestamp === 0) {
      this.nextWrittenSampleTimestamp = idealPosition;
    }
    let sampleDelta = 0;
    // this.log(`= ideal position ${idealBufferPosition}, current position ${this.buffer.getReaderPointer()}, diff ${idealBufferPosition - this.buffer.getReaderPointer()}`);
    if (this.delayedDriftCorrection) {
      sampleDelta = Math.floor(Math.min((chunk.length / this.channels) * 0.02, Math.abs(this.delayedDriftCorrection) * 0.1)) * Math.sign(this.delayedDriftCorrection); // max 1% sample to remove or duplicate, or 10% of drift
      this.delayedDriftCorrection -= sampleDelta;
      if (sampleDelta === 0) {
        this.log(`= finished delayed soft drift correction`);
        this.delayedDriftCorrection = 0;
        this.ignoreDriftFor = DRIFT_CORRECTION_MIN_INTERVAL;
      }
    } else if (!this.ignoreDriftFor) {
      const drift = Math.floor(idealPosition - this.nextWrittenSampleTimestamp);
      const driftDuration = drift / (OPUS_ENCODER_RATE / 1000);
      if (Math.abs(driftDuration) > this.hardSyncThreshold) {
        // the drift is too important, this can happens in case the CPU was locked for a while (after suspending the device for example)
        // this will induce a audible glitch
        this.nextWrittenSampleTimestamp = idealPosition;
        this.ignoreDriftFor = DRIFT_CORRECTION_MIN_INTERVAL;
        this.log(`= hard sync: ${driftDuration}ms`);
      } else if (Math.abs(driftDuration) > this.softSyncThreshold) {
        // we should be correcting for the drift but it's small enough that we can do this only by adding
        // or removing some samples in the output buffer
        // if drift is > 0, it means the audio device is going too fast
        // so we need to slow down the rate at which we read from the audio buffer to go back to the correct time
        sampleDelta = Math.floor(Math.min((chunk.length / this.channels) * 0.02, Math.abs(drift) * 0.1)) * Math.sign(drift); // max 1% sample to remove or duplicate, or 10% of drift
        this.ignoreDriftFor = DRIFT_CORRECTION_MIN_INTERVAL;
        this.delayedDriftCorrection = drift - sampleDelta;
        this.log(`= soft sync: ${driftDuration}ms (${drift} samples), injecting ${sampleDelta} samples now`);
      }
    }
    if (this.ignoreDriftFor) {
      this.ignoreDriftFor = Math.max(0, this.ignoreDriftFor - (chunk.length / this.channels));
    }
    const samplesToReadByChannel = (chunk.length / this.channels) + sampleDelta;
    const buffer = smartResizeAudioBuffer(
      chunk,
      samplesToReadByChannel,
      this.channels,
    );
    const bufferTimestamp = this.nextWrittenSampleTimestamp;
    this.nextWrittenSampleTimestamp += samplesToReadByChannel;
    return { bufferTimestamp, buffer };
  }
}

export class SynchronizedAudioBuffer {
  private returnBuffer = Buffer.alloc(128 * Float32Array.BYTES_PER_ELEMENT * 2); // start with a reasonably large buffer that will be resized if necessary
  private typedReturnBuffer = new Float32Array(this.returnBuffer.buffer);
  private delayedDriftCorrection = 0;
  // number of samples to wait until starting to correct for drift again, used to prevent over correction
  private ignoreDriftFor = 0;
  public softSyncThreshold: number;
  public hardSyncThreshold: number;

  constructor(
    public buffer: CircularTypedArray<Float32Array>,
    public channels: number,
    public idealPositionPerChannelGetter: () => number,
    {
      debug = false,
      softSyncThreshold = SOFT_SYNC_MIN_AUDIO_DRIFT,
      hardSyncThreshold = HARD_SYNC_MIN_AUDIO_DRIFT,
    } = {},
  ) {
    // eslint-disable-next-line no-console
    this.log = debug ? console.log : () => null;
    this.softSyncThreshold = softSyncThreshold;
    this.hardSyncThreshold = hardSyncThreshold;
  }

  log: (str: string) => void;

  readNextChunk(samplesPerChannel: number) {
    const idealBufferPosition = this.idealPositionPerChannelGetter() * this.channels;
    let sampleDelta = 0;
    if (this.buffer.getReaderPointer() === 0) {
      this.buffer.setReaderPointer(idealBufferPosition);
    }
    // this.log(`= ideal position ${idealBufferPosition}, current position ${this.buffer.getReaderPointer()}, diff ${idealBufferPosition - this.buffer.getReaderPointer()}`);
    if (this.delayedDriftCorrection) {
      sampleDelta = Math.floor(Math.min(samplesPerChannel * 0.02, Math.abs(this.delayedDriftCorrection) * 0.1)) * Math.sign(this.delayedDriftCorrection); // max 1% sample to remove or duplicate, or 10% of drift
      this.delayedDriftCorrection -= sampleDelta;
      if (sampleDelta === 0) {
        this.log(`= finished delayed soft drift correction`);
        this.delayedDriftCorrection = 0;
        this.ignoreDriftFor = DRIFT_CORRECTION_MIN_INTERVAL;
      }
    } else if (!this.ignoreDriftFor) {
      const drift = Math.floor(idealBufferPosition - this.buffer.getReaderPointer());
      const driftDuration = drift / (OPUS_ENCODER_RATE / 1000);
      if (Math.abs(driftDuration) > this.hardSyncThreshold) {
        // the drift is too important, this can happens in case the CPU was locked for a while (after suspending the device for example)
        // this will induce a audible glitch
        this.buffer.setReaderPointer(idealBufferPosition);
        this.ignoreDriftFor = DRIFT_CORRECTION_MIN_INTERVAL;
        this.log(`= hard sync: ${driftDuration}ms`);
      } else if (Math.abs(driftDuration) > this.softSyncThreshold) {
        // we should be correcting for the drift but it's small enough that we can do this only by adding
        // or removing some samples in the output buffer
        // if drift is > 0, it means the audio device is going too fast
        // so we need to slow down the rate at which we read from the audio buffer to go back to the correct time
        sampleDelta = Math.floor(Math.min(samplesPerChannel * 0.02, Math.abs(drift) * 0.1)) * Math.sign(drift); // max 1% sample to remove or duplicate, or 10% of drift
        this.ignoreDriftFor = DRIFT_CORRECTION_MIN_INTERVAL;
        this.delayedDriftCorrection = Math.floor((drift - sampleDelta) * 0.4);
        this.log(`= soft sync: ${driftDuration}ms (${drift} samples), injecting ${sampleDelta} samples now`);
      }
    }
    if (this.ignoreDriftFor) {
      this.ignoreDriftFor = Math.max(0, this.ignoreDriftFor - samplesPerChannel);
    }
    const samplesToReadByChannel = samplesPerChannel + sampleDelta;
    if (this.returnBuffer.byteLength !== samplesToReadByChannel * this.channels * Float32Array.BYTES_PER_ELEMENT) {
      this.returnBuffer = Buffer.alloc(samplesToReadByChannel * this.channels * Float32Array.BYTES_PER_ELEMENT);
      this.typedReturnBuffer = new Float32Array(this.returnBuffer.buffer);
    }
    this.buffer.getAtReaderPointerInTypedArray(this.typedReturnBuffer, samplesToReadByChannel * this.channels);
    const buffer = smartResizeAudioBuffer(
      this.typedReturnBuffer,
      samplesPerChannel,
      this.channels,
    );
    return buffer;
  }
}
