const {readFileSync, writeFileSync} = require('fs');
const {performance} = require('perf_hooks')
const addon = require('bindings')('speex-resampler');

// console.log(addon);

// console.log(addon())

// const resampler = addon();
// console.log(resampler);

const resampler2 = new addon.SpeexResampler(2, 44100, 48000);

console.log(resampler2);

const pcmData = readFileSync('./test.pcm');
// const firstSecond = pcmData.subarray(0, 44100 * 3);

const start = performance.now();
const res = resampler2.processChunk(pcmData);
const end = performance.now();
console.log(Number(end - start));

console.log(`input: ${pcmData.length}, duration: ${pcmData.length / 44100 / 2 / 2}`);
console.log(`output: ${res.length}, duration: ${res.length / 48000 / 2 / 2}`);
console.log(`should be ${(48000 * pcmData.length ) / 44100}`);

writeFileSync('./out.pcm', res);
