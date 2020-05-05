import { Readable, Transform } from 'stream';
import { now } from './time';

export interface AudioChunkStreamOutput {
  i: number;
  chunk: Buffer;
}

export class AudioChunkStream extends Readable {
  interval: number;
  sampleSize: number;
  sourceStream: NodeJS.ReadableStream;
  private readInterval: NodeJS.Timeout;
  creationTime: number = now();
  lastEmittedChunkIndex: number;

  constructor(sourceStream: NodeJS.ReadableStream, interval: number, sampleSize: number) {
    super({
      objectMode: true,
    });
    this.sourceStream = sourceStream;
    this.interval = interval;
    this.sampleSize = sampleSize;
    this.lastEmittedChunkIndex = -1;
    this.sourceStream.on('readable', this.startReadLoop);
  }

  private startReadLoop = () => {
    if (this.readInterval) {
      return;
    }
    this._pushNecessaryChunks();
    this.readInterval = setInterval(this._pushNecessaryChunks, this.interval);
  }

  private stopReadLoop = () => {
    if (this.readInterval) {
      clearInterval(this.readInterval);
      delete this.readInterval;
    }
  }

  _read() {
    this.startReadLoop();
  }

  now = () => now() - this.creationTime;

  _pushNecessaryChunks = () => {
    while (true) {
      let currentChunkIndex = this.lastEmittedChunkIndex + 1;
      if (this.lastEmittedChunkIndex === -1) { // the stream was interrupted because source couldn't be read, restart a sequence
        currentChunkIndex = Math.floor(this.now() / this.interval);
        // console.log('Stream data available, starting new chunk serie');
      }
      const currentChunkLatency = this.now() - (currentChunkIndex * this.interval);
      if (currentChunkLatency < 0) { // this chunk is in the future, do nothing and wait for next tick
        break;
      }
      let chunk = this.sourceStream.read(this.sampleSize) as Buffer;
      if (chunk === null) { // nothing to read from source, we need to compute the next chunk from time instead of the sequence
        // console.log('Stream out of data, stopping reading loop until new data arrives');
        this.lastEmittedChunkIndex = -1;
        this.stopReadLoop();
        break;
      }
      if (chunk.length !== this.sampleSize) {
        // it could mean we are at the end of the stream and receiving an incomplete chunk
        // so we complete it with zeros
        const incompleteChunk = chunk;
        chunk = Buffer.alloc(this.sampleSize);
        chunk.set(incompleteChunk);
      }
      const chunkOutput: AudioChunkStreamOutput = {
        i: currentChunkIndex,
        chunk,
      };
      this.push(chunkOutput);
      this.lastEmittedChunkIndex = currentChunkIndex;
    }
  }
}

export class AudioChunkStreamEncoder extends Transform {
  constructor() {
    super({
      writableObjectMode: true,
    });
  }
  _transform(d: AudioChunkStreamOutput, encoding, callback) {
    const encodedChunk = Buffer.alloc(
      4 // Index: UInt32
      + d.chunk.length,
    );
    encodedChunk.writeUInt32LE(d.i, 0);
    d.chunk.copy(encodedChunk, 4);
    callback(null, encodedChunk);
  }
}

export class AudioChunkStreamDecoder extends Transform {
  constructor() {
    super({
      readableObjectMode: true,
    });
  }
  _transform(d: Buffer, encoding, callback) {
    callback(null, {
      i: d.readUInt32LE(0),
      chunk: d.subarray(4),
    });
  }
}
