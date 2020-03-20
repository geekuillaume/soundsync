type TypedArray = Int8Array |
  Uint8Array |
  Int16Array |
  Uint16Array |
  Int32Array |
  Uint32Array |
  Uint8ClampedArray |
  Float32Array |
  Float64Array;

export class CircularTypedArray<T extends TypedArray> {
  TypedArrayConstructor: new (...args) => T;
  buffer: T;

  constructor(TypedArrayConstructor: new (...args) => T, length: number) {
    this.TypedArrayConstructor = TypedArrayConstructor;
    this.buffer = new TypedArrayConstructor(length);
  }

  set(data: Buffer, offset: number) {
    const realOffset = offset % this.buffer.length;
    const overflow = Math.max(0, (realOffset + data.length) - this.buffer.length);
    if (!overflow) {
      this.buffer.set(data, realOffset);
      return;
    }
    this.buffer.set(data.subarray(0, data.length - overflow), realOffset);
    this.set(data.subarray(data.length - overflow), realOffset + (data.length - overflow));
  }

  get(offset: number, length: number): T {
    // TODO: implement a way to reset read samples to 0 to prevent outputting the same sample
    // again if the buffer runs too low and we don't have the new chunk from the source
    const realOffset = offset % this.buffer.length;
    const overflow = Math.max(0, (realOffset + length) - this.buffer.length);
    if (!overflow) {
      return new this.TypedArrayConstructor(this.buffer.subarray(realOffset, realOffset + length));
    }
    const output = new this.TypedArrayConstructor(length);
    output.set(this.buffer.subarray(realOffset, this.buffer.length - overflow), 0);
    output.set(this.buffer.subarray(0, overflow), length - overflow);
    return output;
  }

  // this will copy the info in another buffer passed in parameter and empty the current buffer for this offset + length
  getInTypedArray(targetTypedArray: T, offset: number, length: number) {
    const realOffset = offset % this.buffer.length;
    const overflow = Math.max(0, (realOffset + length) - this.buffer.length);
    if (!overflow) {
      targetTypedArray.set(this.buffer.subarray(realOffset, realOffset + length));
      this.buffer.fill(0, realOffset, realOffset + length);
    } else {
      targetTypedArray.set(this.buffer.subarray(realOffset, this.buffer.length - overflow), 0);
      this.buffer.fill(0, realOffset, this.buffer.length - overflow);
      targetTypedArray.set(this.buffer.subarray(0, overflow), length - overflow);
      this.buffer.fill(0, 0, overflow);
    }
  }
}
