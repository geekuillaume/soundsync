/// <reference types="emscripten" />

/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable camelcase */
import Opus from './opus_decoder';

// declare function _opus_decoder_create(
//   samplingRate: number, channels: number, error_ptr: number): number;
// declare function _opus_decode_float(
//   handle: number, data: number, len: number,
//   pcm: number, frameSize: number, decode_fec: number): number;
// declare function _opus_decoder_destroy(handle: number): void;

export class OpusDecoder {
  worker: Worker;
  handle: number;
  bufPtr: number;
  pcmPtr: number;
  buf: Uint8Array;
  pcm: Float32Array;
  frameSize: number;
  module: EmscriptenModule;

  constructor(readonly sampleRate: number, readonly channels: number, readonly application: string) {
  }

  // The promise decorator is necessarry because else the js engine will try to call .then in loop
  // and so will create an infinite loop
  setup = () => new Promise((resolve) => {
    Opus().then((Module: EmscriptenModule) => {
      this.module = Module;
      const err = this.module._malloc(4);
      this.handle = this.module._opus_decoder_create(this.sampleRate, this.channels, err);
      const errNum = this.module.getValue(err, 'i32');
      this.module._free(err);
      if (errNum !== 0) {
        throw new Error(`Could not create decoder: ${errNum}`);
      }

      this.frameSize = (this.sampleRate * 60) /* max frame duration[ms] */ / 1000;
      const bufSize = 1275 * 3 + 7;
      const pcmSamples = this.frameSize * this.channels;
      this.bufPtr = this.module._malloc(bufSize);
      this.pcmPtr = this.module._malloc(4 * pcmSamples);
      this.buf = this.module.HEAPU8.subarray(this.bufPtr, this.bufPtr + bufSize);
      this.pcm = this.module.HEAPF32.subarray(this.pcmPtr / 4, this.pcmPtr / 4 + pcmSamples);
      resolve();
    });
  })

  async decode(data: Buffer) {
    if (!this.handle) {
      await this.setup();
    }
    this.buf.set(new Uint8Array(data));
    const ret = this.module._opus_decode_float(this.handle, this.bufPtr, data.byteLength,
      this.pcmPtr, this.frameSize, 0);
    if (ret < 0) {
      throw new Error(`Could not decode chunk: ${ret}`);
    }

    return (new Float32Array(this.pcm.subarray(0, ret * this.channels))).buffer;
  }
}
