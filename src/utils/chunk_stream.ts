import { Readable, Transform } from 'stream';
import Minipass from 'minipass';
import { now } from './time';

export interface AudioChunkStreamOutput {
  i: number;
  chunk: Buffer;
}

// This is used to control the output throughput of a stream and emit chunks of "chunkSize" bytes every "chunkDuration" ms
// every chunk has a index corresponding to when this chunk is emitted (i = [time when chunk was read relative to the creating of the stream] / chunkDuration)
// as long as the source stream can be read, the index is incremented directly
// if the source stream is interrupted (nothing can be read anymore), the next time a chunk is available, the index will be recalculated from the time
export class AudioChunkStream extends Minipass {
  private readInterval: NodeJS.Timeout;
  creationTime: number = now();
  lastEmittedChunkIndex: number;

  constructor(public sourceStream: NodeJS.ReadableStream, public chunkDuration: number, public chunkSize: number) {
    super({
      objectMode: true,
    });
    this.lastEmittedChunkIndex = -1;
    this.sourceStream.on('readable', this.startReadLoop);
  }

  private startReadLoop = () => {
    if (this.readInterval) {
      return;
    }
    this._pushNecessaryChunks();
    this.readInterval = setInterval(this._pushNecessaryChunks, this.chunkDuration);
  }

  private stopReadLoop = () => {
    if (this.readInterval) {
      clearInterval(this.readInterval);
      delete this.readInterval;
    }
  }

  private now = () => now() - this.creationTime;

  _pushNecessaryChunks = () => {
    while (true) {
      const currentChunkIndex = this.lastEmittedChunkIndex === -1 ? Math.floor(this.now() / this.chunkDuration) : this.lastEmittedChunkIndex + 1;
      // if this.lastEmittedChunkIndex === -1 the stream was interrupted because source couldn't be read, restart a sequence
      const currentChunkLatency = this.now() - (currentChunkIndex * this.chunkDuration);
      if (currentChunkLatency < 0) { // this chunk is in the future, do nothing and wait for next tick
        break;
      }
      let chunk = this.sourceStream.read(this.chunkSize) as Buffer;
      if (chunk === null) {
        // nothing to read from source, we need to compute the next chunk from time instead of the sequence
        console.log('Stream out of data, stopping reading loop until new data arrives');
        this.lastEmittedChunkIndex = -1;
        this.stopReadLoop();
        break;
      }
      if (this.lastEmittedChunkIndex === -1) {
        console.log('Stream started again');
      }
      if (chunk.length !== this.chunkSize) {
        console.log('INCOMPLETE CHUNK');
        // it could mean we are at the end of the stream and receiving an incomplete chunk
        // so we complete it with zeros
        const incompleteChunk = chunk;
        chunk = Buffer.alloc(this.chunkSize);
        chunk.set(incompleteChunk);
      }
      const chunkOutput: AudioChunkStreamOutput = {
        i: currentChunkIndex,
        chunk,
      };
      // console.log(`+ ${currentChunkIndex}`);
      this.write(chunkOutput);
      this.lastEmittedChunkIndex = currentChunkIndex;
    }
  }
}

export class AudioChunkStreamEncoder extends Minipass {
  constructor() {
    super({
      objectMode: true,
    });
  }

  write(d: any, encoding?: string | (() => void), cb?: () => void) {
    const encodedChunk = Buffer.alloc(
      4 // Index: UInt32
      + d.chunk.byteLength,
    );
    encodedChunk.writeUInt32LE(d.i, 0);
    d.chunk.copy(encodedChunk, 4);
    const returnVal = super.write(encodedChunk);
    if (cb) {
      cb();
    }
    return returnVal;
  }
}

export class AudioChunkStreamDecoder extends Minipass {
  constructor() {
    super({
      objectMode: true,
    });
  }
  write(d: any, encoding?: string | (() => void), cb?: () => void) {
    const returnVal = super.write({
      i: d.readUInt32LE(0),
      chunk: d.subarray(4),
    });
    if (cb) {
      cb();
    }
    return returnVal;
  }

  _transform(d: Buffer, encoding, callback) {
    callback(null, {
      i: d.readUInt32LE(0),
      chunk: d.subarray(4),
    });
  }
}
