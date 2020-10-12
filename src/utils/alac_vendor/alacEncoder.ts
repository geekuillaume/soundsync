/* eslint-disable @typescript-eslint/camelcase */
/// <reference types="emscripten" />

import AlacWasm from './alac_wasm';

interface EmscriptenModuleAlacEncoder extends EmscriptenModule {
  _initiate_alac_encoder(chunk_len: number, sampleRate: number, sampleSize: number, channels: number): number;
  _alac_encode(encoderPtr: number, pcmBufferPtr: number, inputFrames: number, alacBufferPtr: number): number;
  _destroy_encoder(encoderPtr: number): void;
  _alac_encode_raw(dest: number, src: number, size: number);

  getValue(ptr: number, type: string): any;
  setValue(ptr: number, value: any, type: string): any;
  AsciiToString(ptr: number): string;
}

let alacModule: EmscriptenModuleAlacEncoder;
const globalModulePromise = AlacWasm().then((s) => { alacModule = s; });

const CHANNELS = 2;
const ALAC_HEADER_SIZE = 3;

export class AlacEncoder {
  private encoderPtr = 0;
  private pcmBufferPtr = 0;
  private pcmBufferSize = 0;
  private alacBufferPtr = 0;
  private alacBufferSize = 0;

  static initPromise = globalModulePromise as Promise<any>;

  constructor(public chunkLength: number, public sampleRate: number, public sampleSize: number, public channels: number) {
  }

  encode(chunk: Int16Array | Uint16Array, outputBuffer: Uint8Array) {
    if (!alacModule) {
      throw new Error('You need to wait for AlacEncoder.initPromise before calling this method');
    }
    if (!this.encoderPtr) {
      this.encoderPtr = alacModule._initiate_alac_encoder(this.chunkLength, this.sampleRate, this.sampleSize, this.channels);
    }

    // We check that we have as many chunks for each channel and that the last chunk is full (2 bytes)
    if (!chunk || chunk.length % CHANNELS !== 0) {
      throw new Error(`Chunk length should be a multiple of [channels]`);
    }

    // Resizing the input buffer in the WASM memory space to match what we need
    if (this.pcmBufferSize < chunk.byteLength) {
      if (this.pcmBufferPtr !== -1) {
        alacModule._free(this.pcmBufferPtr);
      }
      this.pcmBufferPtr = alacModule._malloc(chunk.byteLength);
      this.pcmBufferSize = chunk.byteLength;
    }

    // Resizing the output buffer in the WASM memory space to match what we need
    if (this.alacBufferSize < chunk.byteLength + ALAC_HEADER_SIZE) {
      if (this.alacBufferPtr !== -1) {
        alacModule._free(this.alacBufferPtr);
      }
      this.alacBufferPtr = alacModule._malloc(chunk.byteLength + ALAC_HEADER_SIZE);
      this.alacBufferSize = chunk.byteLength + ALAC_HEADER_SIZE;
    }

    // Copying the info from the input Buffer in the WASM memory space
    alacModule.HEAPU8.set(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), this.pcmBufferPtr);

    alacModule._alac_encode_raw(this.alacBufferPtr, this.pcmBufferPtr, chunk.byteLength);

    // const outputLength = alacModule._alac_encode(
    //   this.encoderPtr,
    //   this.pcmBufferPtr,
    //   chunk.length / this.channels,
    //   this.alacBufferPtr,
    // );

    // if (outputLength === -1) {
    //   throw new Error('Error while encoding');
    // }
    // if (outputBuffer.byteLength < outputLength) {
    //   throw new Error(`Provided outputBuffer is too small: ${outputBuffer.byteLength} < ${outputLength}`);
    // }
    outputBuffer.set(alacModule.HEAPU8.subarray(
      this.alacBufferPtr,
      this.alacBufferPtr + chunk.byteLength + ALAC_HEADER_SIZE,
    ));
    // return outputLength;
  }
}
