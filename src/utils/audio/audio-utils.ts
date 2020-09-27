import { clamp } from 'lodash';

// from https://github.com/mattdesl/codevember/blob/gh-pages/src/audio-util.js
export function freq2index(freq, sampleRate, fftSize) {
  return clamp(Math.floor(freq / (sampleRate / fftSize)), 0, fftSize / 2);
}

// from https://github.com/mattdesl/codevember/blob/gh-pages/src/audio-util.js
function getAverageFrom(freqs, minHz, maxHz, sampleRate, fftSize) {
  let start = freq2index(minHz, sampleRate, fftSize);
  const end = freq2index(maxHz, sampleRate, fftSize);
  const count = end - start;
  let sum = 0;
  for (; start < end; start++) {
    sum += freqs[start] / 255;
  }
  return count === 0 ? 0 : (sum / count);
}

// from https://github.com/mattdesl/codevember/blob/gh-pages/src/audio-util.js
export function index2freq(n, sampleRate, fftSize) {
  return n * sampleRate / fftSize;
}

// from https://github.com/mattdesl/codevember/blob/gh-pages/src/audio-util.js
export function getAnalyserAverages(analyser, minHz, maxHz) {
  const node = Array.isArray(analyser.analyser) ? analyser.analyser[0] : analyser.analyser;
  const sampleRate = analyser.ctx.sampleRate;
  const fftSize = node.fftSize;
  const freqs = analyser.frequencies();
  return getAverageFrom(freqs, minHz, maxHz, sampleRate, fftSize);
}

export function frequencyAverages(sampleRate, fftSize) {
  return function getAverage(freqs, minHz, maxHz) {
    return getAverageFrom(freqs, minHz, maxHz, sampleRate, fftSize);
  };
}

export const remapChannels = (chunk: Float32Array, sourceChannelCount: number, targetChannelCount: number) => {
  if (targetChannelCount === 1 && sourceChannelCount === 2) {
    // remap stero to mono by taking the mean value of both channels samples
    for (let sample = 0; sample < chunk.length / sourceChannelCount; sample++) {
      chunk[sample] = (chunk[(sample * sourceChannelCount)] + chunk[(sample * sourceChannelCount) + 1]) / 2;
    }
    return new Float32Array(chunk.buffer, chunk.byteOffset, chunk.length / 2);
  }
  if (targetChannelCount !== 2 || sourceChannelCount !== 2) {
    throw new Error('Channel mapping with this count is not supported');
  }
  return chunk;
};
