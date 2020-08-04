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
  pointersBuffer: ArrayBuffer | SharedArrayBuffer;
  pointersTypedBuffer: Float64Array;

  constructor(TypedArrayConstructor: new (...args) => T, lengthOrSharedArrayBuffer: number | SharedArrayBuffer) {
    this.TypedArrayConstructor = TypedArrayConstructor;
    this.buffer = new TypedArrayConstructor(lengthOrSharedArrayBuffer);

    if (typeof SharedArrayBuffer !== 'undefined') {
      this.pointersBuffer = new SharedArrayBuffer(2 * Float64Array.BYTES_PER_ELEMENT);
    } else {
      this.pointersBuffer = new ArrayBuffer(2 * Float64Array.BYTES_PER_ELEMENT);
    }
    this.pointersTypedBuffer = new Float64Array(this.pointersBuffer);
  }

  getPointersBuffer = () => this.pointersBuffer
  setPointersBuffer = (pointersBuffer: SharedArrayBuffer) => {
    this.pointersBuffer = pointersBuffer;
    this.pointersTypedBuffer = new Float64Array(this.pointersBuffer);
  }

  setReaderPointer = (value: number) => {
    this.pointersTypedBuffer[1] = value;
  }
  getReaderPointer = () => this.pointersTypedBuffer[1]
  advanceReaderPointer = (value: number) => {
    const previousValue = this.pointersTypedBuffer[1];
    this.pointersTypedBuffer[1] += value;
    return previousValue;
  }

  setWriterPointer = (value: number) => {
    this.pointersTypedBuffer[0] = value;
  }
  getWriterPointer = () => this.pointersTypedBuffer[0]
  advanceWriterPointer = (value: number) => {
    const previousValue = this.pointersTypedBuffer[0];
    this.pointersTypedBuffer[0] += value;
    return previousValue;
  }

  set(data: T, offset: number) {
    const realOffset = offset % this.buffer.length;
    const overflow = Math.max(0, (realOffset + data.length) - this.buffer.length);
    if (!overflow) {
      this.buffer.set(data, realOffset);
      return;
    }
    this.buffer.set(data.subarray(0, data.length - overflow), realOffset);
    this.set(data.subarray(data.length - overflow) as T, realOffset + (data.length - overflow));
  }

  setFromWriterPointer(data: T) {
    const offset = this.advanceWriterPointer(data.length);
    this.set(data, offset);
  }

  fill(offset: number, length: number, data: number) {
    const realOffset = offset % this.buffer.length;
    const overflow = Math.max(0, (realOffset + length) - this.buffer.length);
    if (!overflow) {
      this.buffer.fill(data, realOffset, realOffset + length);
      return;
    }
    this.buffer.fill(data, realOffset, this.buffer.length);
    this.buffer.fill(data, 0, overflow);
  }

  get(offset: number, length: number): T {
    // TODO: implement a way to reset read samples to 0 to prevent outputting the same sample
    // again if the buffer runs too low and we don't have the new chunk from the source
    const realOffset = offset % this.buffer.length;
    const overflow = Math.max(0, (realOffset + length) - this.buffer.length);
    if (!overflow) {
      // @ts-ignore
      return this.buffer.subarray(realOffset, realOffset + length);
    }
    const output = new this.TypedArrayConstructor(length);
    output.set(this.buffer.subarray(realOffset, this.buffer.length - overflow), 0);
    output.set(this.buffer.subarray(0, overflow), length - overflow);
    return output;
  }

  getAtReaderPointer(length: number): T {
    const offset = this.advanceReaderPointer(length);
    const realOffset = offset % this.buffer.length;
    const overflow = Math.max(0, (realOffset + length) - this.buffer.length);
    if (!overflow) {
      // @ts-ignore
      return this.buffer.subarray(realOffset, realOffset + length);
    }
    const output = new this.TypedArrayConstructor(length);
    output.set(this.buffer.subarray(realOffset, this.buffer.length - overflow), 0);
    output.set(this.buffer.subarray(0, overflow), length - overflow);
    return output;
  }

  // This will prevent a new buffer from being allocated and will empty read data
  getAtReaderPointerInTypedArray(targetTypedArray: T, length: number): T {
    const offset = this.advanceReaderPointer(length);
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
    return targetTypedArray;
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
