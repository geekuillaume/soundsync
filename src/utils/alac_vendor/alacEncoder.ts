/* eslint-disable @typescript-eslint/camelcase */
/// <reference types="emscripten" />

import AlacWasm from './alac_wasm';

interface EmscriptenModuleAlacEncoder extends EmscriptenModule {
  _initiate_alac_encoder(): number;
  _alac_encode(encoderPtr: number, pcmBufferPtr: number, alacBufferPtr: number, bufferSize: number): number;
  _destroy_encoder(encoderPtr: number): void;

  getValue(ptr: number, type: string): any;
  setValue(ptr: number, value: any, type: string): any;
  AsciiToString(ptr: number): string;
}

let alacModule: EmscriptenModuleAlacEncoder;
const globalModulePromise = AlacWasm().then((s) => { alacModule = s; });

const CHANNELS = 2;

export class AlacEncoder {
  private encoderPtr = 0;
  private pcmBufferPtr = 0;
  private pcmBufferSize = 0;
  private alacBufferPtr = 0;
  private alacBufferSize = 0;

  static initPromise = globalModulePromise as Promise<any>;

  constructor() {
    this.encoderPtr = alacModule._initiate_alac_encoder();
  }

  encode(chunk: Int16Array, outputBuffer: Uint8Array) {
    if (!alacModule) {
      throw new Error('You need to wait for AlacEncoder.initPromise before calling this method');
    }
    // We check that we have as many chunks for each channel and that the last chunk is full (2 bytes)
    if (chunk && chunk.length % (CHANNELS * Uint16Array.BYTES_PER_ELEMENT) !== 0) {
      throw new Error(`Chunk length should be a multiple of 2 * ${Uint16Array.BYTES_PER_ELEMENT} bytes`);
    }

    // Resizing the input buffer in the WASM memory space to match what we need
    if (this.pcmBufferSize < chunk.length * chunk.BYTES_PER_ELEMENT) {
      if (this.pcmBufferPtr !== -1) {
        alacModule._free(this.pcmBufferPtr);
      }
      this.pcmBufferPtr = alacModule._malloc(chunk.length * chunk.BYTES_PER_ELEMENT);
      this.pcmBufferSize = chunk.length * chunk.BYTES_PER_ELEMENT;
    }

    // Resizing the output buffer in the WASM memory space to match what we need
    if (this.alacBufferPtr < chunk.length * chunk.BYTES_PER_ELEMENT) {
      if (this.alacBufferSize !== -1) {
        alacModule._free(this.alacBufferSize);
      }
      this.alacBufferSize = alacModule._malloc(chunk.length * chunk.BYTES_PER_ELEMENT);
      this.alacBufferSize = chunk.length * chunk.BYTES_PER_ELEMENT;
    }

    // Copying the info from the input Buffer in the WASM memory space
    alacModule.HEAPU8.set(chunk, this.pcmBufferPtr);

    const outputLength = alacModule._alac_encode(
      this.encoderPtr,
      this.pcmBufferPtr,
      this.alacBufferPtr,
      chunk.length * chunk.BYTES_PER_ELEMENT,
    );

    if (outputLength === -1) {
      throw new Error('Error while encoding');
    }

    if (outputBuffer.length < outputLength) {
      throw new Error(`Provided outputBuffer is too small: ${outputBuffer.length} < ${outputLength}`);
    }
    outputBuffer.set(alacModule.HEAPU8.subarray(
      this.alacBufferPtr,
      this.alacBufferPtr + outputLength,
    ));
    return outputLength;
  }
}
