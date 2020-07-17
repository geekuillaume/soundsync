import MiniPass from 'minipass';
import blackman from 'scijs-window-functions/blackman';
import ndarray from 'ndarray';
import fft from 'ndarray-fft';

const gainToDecibel = (value) => 20 * (0.43429 * Math.log(value));

export class FFTStream extends MiniPass {
  frequencyData: Float32Array;
  minDecibel = -100;
  maxDecibel = 0;

  // contains the last [size] samples written
  private audioBuffer: Float32Array;
  private audioBufferFillCount = 0;

  // stores the last [size] samples written after being windowed with blackman
  private fftInputBuffer: Float32Array;
  private fftInputBufferNdarray: ndarray;
  // stores the raw output for the FFT pass
  private fftOutputBuffer: Float32Array;
  private fftOutputBufferNdarray: ndarray;
  // stores the gain frequency data after smoothing
  private gainFrequencyData: Float32Array;

  constructor(public size, public smoothingTimeConstant = 0.6, public channelsCount: number, public selectedChannel: number) {
    super();
    this.frequencyData = new Float32Array(size);
    this.audioBuffer = new Float32Array(size);

    this.fftInputBuffer = new Float32Array(size);
    this.fftInputBufferNdarray = ndarray(this.fftInputBuffer);

    this.fftOutputBuffer = new Float32Array(size);
    this.fftOutputBufferNdarray = ndarray(this.fftOutputBuffer);

    this.gainFrequencyData = new Float32Array(size);
  }

  write(d: any) {
    const inputData = new Float32Array(d.buffer);
    const inputDataMono = new Float32Array(inputData.length / this.channelsCount);
    for (let i = 0; i < inputDataMono.length; i++) {
      inputDataMono[i] = inputData[i * this.channelsCount + this.selectedChannel];
    }

    let consumedSamples = 0;
    // We want to execute the fft operation on chunks of this.size samples, if a input chunk is smaller, we keep it in memory
    // and then concatenate it with the next sample. If the input chunk is bigger than this.size, we execute the fft operation
    // multiple times on chunks of this.size samples
    while (consumedSamples < inputDataMono.length) {
      const chunk = inputData.subarray(consumedSamples, consumedSamples + (this.size - this.audioBufferFillCount));
      consumedSamples += chunk.length;
      this.audioBuffer.set(chunk, this.audioBufferFillCount);
      this.audioBufferFillCount += chunk.length;
      // We have enough data to execute the FFT
      if (this.audioBufferFillCount === this.size) {
        // preparing fft input buffer
        this.fftInputBuffer.set(this.audioBuffer);
        // Apply windowing function
        for (let i = 0; i < this.fftInputBuffer.length; i++) {
          this.fftInputBuffer[i] *= blackman(i, this.size);
        }
        /// preparing fft output buffer
        this.fftOutputBuffer.fill(0);

        fft(1, this.fftInputBufferNdarray, this.fftOutputBufferNdarray);
        // console.log('from my implementation', this.fftOutputBufferNdarray);
        // Apply smoothing
        // console.log(this.fftOutputBuffer);
        for (let i = 0; i < this.frequencyData.length; i++) {
          this.gainFrequencyData[i] = (this.smoothingTimeConstant * Math.abs(this.fftOutputBuffer[i] / this.size))
            + ((1 - this.smoothingTimeConstant) * this.gainFrequencyData[i]);
        }
        const rangeScaleFactor = 1 / (this.maxDecibel - this.minDecibel);
        for (let i = 0; i < this.frequencyData.length; i++) {
          this.frequencyData[i] = 255 * (
            Math.max(
              gainToDecibel(this.gainFrequencyData[i]),
              this.minDecibel,
            )
            - this.minDecibel
          ) * rangeScaleFactor;
        }
        // we don't need to empty the audio buffer as it will be overwritten by the next operation
        this.audioBufferFillCount = 0;
      }
    }

    return true;
  }
}
