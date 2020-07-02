import Minipass from 'minipass';
import essentia from 'essentia.js';
import { OPUS_ENCODER_RATE } from './constants';
import { now } from './time';

// essentia.sampleRate = OPUS_ENCODER_RATE;
// essentia.frameSize = 4096;
// essentia.hopSize = 2048;
// essentia.frameSize =
// console.log(essentia.BeatTrackerMultiFeature);

export class ChunkTransformer extends Minipass {
  chunkBuffer: Float32Array;

  constructor(public chunkSize: number) {
    super();
    this.chunkBuffer = new Float32Array();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  write(d: any, _encoding?: string | (() => void), _cb?: () => void) {
    const concatenatedBuffer = new Float32Array([...this.chunkBuffer, ...d]);
    for (let i = 0; i < Math.floor(concatenatedBuffer.length / this.chunkSize); i++) {
      super.write(concatenatedBuffer.slice(i * this.chunkSize, (i + 1) * this.chunkSize));
    }
    if (concatenatedBuffer.length % this.chunkSize === 0) {
      this.chunkBuffer = new Float32Array();
    } else {
      this.chunkBuffer = concatenatedBuffer.slice(concatenatedBuffer.length - (concatenatedBuffer.length % this.chunkSize), concatenatedBuffer.length);
    }
    return true;
  }
}

export class PeakDetector extends Minipass {
  slidingWindow: number[] = [];

  constructor(public slidingWindowDuration: number) {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  write(d: any, _encoding?: string | (() => void), _cb?: () => void) {
    // this.slidingWindow.push(...d);
    // if (this.slidingWindow.length > (this.slidingWindowDuration * OPUS_ENCODER_RATE)) {
    //   this.slidingWindow = this.slidingWindow.slice(this.slidingWindow.length - (this.slidingWindowDuration * OPUS_ENCODER_RATE));
    // }
    // const slidingWindowFloat32 = new Float32Array(this.slidingWindow);
    // console.log(this.slidingWindow);
    // if (this.slidingWindow.length < OPUS_ENCODER_RATE) {
    //   return true;
    // }
    // console.log('1', new Float32Array(this.slidingWindow));
    // const vector = essentia.arrayToVector(new Float32Array(this.slidingWindow));
    const vector = essentia.arrayToVector(d);
    const start = now();
    const info = essentia.MFCC(vector, 2, 11000, d.length, 0, 'dbamp', 0, 'unit_sum', 40, 13, 48000);
    console.log(essentia.vectorToArray(info.mfcc));
    console.log('took:', now() - start);
    // const info = essentia.RhythmExtractor(vector);
    // console.log(essentia.vectorToArray(info.ticks));
    // const historicalMax = Math.max(...this.slidingWindow);
    // super.write({ peak: max / historicalMax > 0.95, val: Math.min(1, max / historicalMax) });
    return true;
  }
}
// const SlidingWindowMax = require('sliding-window-max');
// const through = require('through2');
// const Fili = require('fili/index');

// const FREQ = 44100;
// const SAMPLES_WINDOW = FREQ * 1.5;
// const MIN_PEAK_DISTANCE = FREQ / 5;
// const MAX_INT16 = Math.pow(2, 16) / 2 - 1;
// const MAX_UINT32 = Math.pow(2, 32) - 1;

// class MusicBeatDetector {
//   constructor(options = {}) {
//     this.threshold = MAX_INT16;
//     this.lastPeakDistance = MAX_UINT32;
//     this.slidingWindowMax = new SlidingWindowMax(SAMPLES_WINDOW, { waitFullRange: false });
//     this.pos = 0;

//     this.sensitivity = options.sensitivity || 0.6;
//     this.debugFilter = options.debugFilter;
//     this.plotter = options.plotter;
//     this.scheduler = options.scheduler;
//     this.minThreashold = options.minThreashold || MAX_INT16 * 0.05;

//     this.leftFilter = this._getBandFilter();
//     this.rightFilter = this._getBandFilter();

//     const analyzeBuffer = this._analyzeBuffer.bind(this);

//     this.through = through(function (packet, enc, cb) {
//       const stream = this;
//       analyzeBuffer(stream, packet, cb);
//     });
//   }

//   getAnalyzer() {
//     return this.through;
//   }

//   _analyzeBuffer(stream, packet, done) {
//     for (let i = 0; i < packet.length; i += 4) {
//       const left = packet.readInt16LE(i);
//       const filteredLeft = this.leftFilter.singleStep(left);

//       if (this._isPeak(filteredLeft)) {
//         const ms = Math.round(this.pos / (FREQ / 1000));
//         stream.emit('peak-detected', ms, this.bpm);
//         if (this.scheduler) this.scheduler(ms);
//       }

//       if (this.debugFilter) {
//         const right = packet.readInt16LE(i + 2);
//         const filteredRight = this.rightFilter.singleStep(right);

//         packet.writeInt16LE(filteredLeft, i);
//         packet.writeInt16LE(filteredRight, i + 2);
//       }
//     }

//     stream.push(packet);
//     done();
//   }

//   _isPeak(sample) {
//     const isPeak = false;
//     this.threshold = Math.max(
//       this.slidingWindowMax.add(sample) * this.sensitivity,
//       this.minThreashold,
//     );

//     const overThreshold = sample >= this.threshold;
//     const enoughTimeSinceLastPeak = this.lastPeakDistance > MIN_PEAK_DISTANCE;

//     if (overThreshold && enoughTimeSinceLastPeak) {
//       this.bpm = Math.round(60 * FREQ / this.lastPeakDistance);
//       this.lastPeakDistance = 0;
//       return true;
//     }

//     if (this.plotter) {
//       this.plotter({ sample, threshold: this.threshold, lastPeakDistance: this.lastPeakDistance });
//     }

//     this.pos++;
//     this.lastPeakDistance++;
//     if (this.lastPeakDistance > MAX_UINT32) this.lastPeakDistance = MAX_UINT32;

//     return false;
//   }

//   _getBandFilter() {
//     const firCalculator = new Fili.FirCoeffs();

//     const firFilterCoeffs = firCalculator.lowpass({
//       order: 100,
//       Fs: FREQ,
//       Fc: 350,
//     });

//     return new Fili.FirFilter(firFilterCoeffs);
//   }
// }
