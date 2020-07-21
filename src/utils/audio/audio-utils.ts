// from https://github.com/mattdesl/codevember/blob/gh-pages/src/audio-util.js

import { clamp } from 'lodash';

export function freq2index(freq, sampleRate, fftSize) {
  return clamp(Math.floor(freq / (sampleRate / fftSize)), 0, fftSize / 2);
}

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

export function index2freq(n, sampleRate, fftSize) {
  return n * sampleRate / fftSize;
}


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
