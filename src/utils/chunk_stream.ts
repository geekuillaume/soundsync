import { Readable, Transform } from 'stream';
import { getCurrentSynchronizedTime } from '../coordinator/timekeeper';

export interface AudioChunkStreamOutput {
  i: number;
  chunk: Buffer;
}

export class AudioChunkStream extends Readable {
  interval: number;
  sampleSize: number;
  sourceStream: NodeJS.ReadableStream;
  readInterval: NodeJS.Timeout;
  creationTime: number = getCurrentSynchronizedTime();
  lastEmitTime: number;

  constructor(sourceStream: NodeJS.ReadableStream, interval: number, sampleSize: number) {
    super({
      objectMode: true,
    });
    this.sourceStream = sourceStream;
    this.interval = interval;
    this.sampleSize = sampleSize;
  }

  _read() {
    if (this.readInterval) {
      return;
    }
    this.lastEmitTime = this.now();
    this.readInterval = setInterval(this._pushNecessaryChunks, this.interval);
  }

  now = () => getCurrentSynchronizedTime() - this.creationTime;

  _pushNecessaryChunks = () => {
    const chunksToEmit = Math.floor((this.now() - this.lastEmitTime) / this.interval);
    for (let i = 0; i < chunksToEmit; i++) {
      const chunkGlobalIndex = Math.floor((this.lastEmitTime / this.interval) + 1);
      let chunk = this.sourceStream.read(this.sampleSize) as Buffer;
      if (chunk === null) {
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
        i: chunkGlobalIndex,
        chunk,
      };
      const canPush = this.push(chunkOutput);
      this.lastEmitTime = this.interval * chunkGlobalIndex;
      // we should always be pushing to consume the audio source at the same speed and not block it
      // if (!canPush) {
      //   clearInterval(this.readInterval);
      //   this.readInterval = null;
      //   break;
      // }
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
