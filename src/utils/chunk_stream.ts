import { Transform } from 'stream';

export class ChunkStream extends Transform {
  chunkSize: number;
  buffer: Buffer = Buffer.alloc(0);

  constructor(chunkSize: number) {
    super();
    this.chunkSize = chunkSize;
  }

  _transform(data: Buffer, encoding, callback) {
    const dataWithBuffer = Buffer.concat([
      this.buffer,
      data,
    ]);

    const chunksAvailables = Math.floor(dataWithBuffer.length / this.chunkSize);
    for (let i = 0; i < chunksAvailables; i++) {
      this.push(dataWithBuffer.subarray(i * this.chunkSize, (i * this.chunkSize) + this.chunkSize));
    }

    const bytesNotPushed = dataWithBuffer.length % this.chunkSize;
    if (bytesNotPushed) {
      this.buffer = dataWithBuffer.subarray(dataWithBuffer.length - bytesNotPushed, dataWithBuffer.length);
    } else {
      this.buffer = Buffer.alloc(0);
    }

    callback(null);
  }
}
