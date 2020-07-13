import Minipass from 'minipass';
import debug from 'debug';
import SpeexResampler from 'speex-resampler';
import { now } from './time';

const l = debug('soundsync:audioSinkDebug');

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
  lastEmittedChunkIndex: number;

  constructor(
    public startTime: number,
    public sourceStream: NodeJS.ReadableStream,
    public chunkDuration: number,
    public chunkSize: number,
  ) {
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

  private now = () => now() - this.startTime;

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
}

// Used to reorder incoming chunk. If a chunk is missing, buffer up to [maxUnorderedChunks] chunks
export class AudioChunkStreamOrderer extends Minipass {
  buffer: AudioChunkStreamOutput[] = [];
  private nextEmittableChunkIndex = -1;

  constructor(public maxUnorderedChunks = 10) {
    super({
      objectMode: true,
    });
  }

  private emitNextChunksInBuffer = () => {
    while (this.buffer.length && this.buffer[0].i === this.nextEmittableChunkIndex) {
      this.emitChunk(this.buffer[0]);
      this.buffer.splice(0, 1);
    }
  }

  private emitChunk = (chunk) => {
    super.write(chunk);
    this.nextEmittableChunkIndex = chunk.i + 1;
  }

  write(d: any, encoding?: string | (() => void), cb?: () => void) {
    if (this.nextEmittableChunkIndex === -1) {
      this.nextEmittableChunkIndex = d.i;
    }
    if (d.i < this.nextEmittableChunkIndex) {
      // late chunk, we already emitted more recent chunks, ignoring
      return true;
    }

    if (this.nextEmittableChunkIndex === d.i) {
      // ordered chunk, act as a passthrough
      this.emitChunk(d);
    } else {
      // unordered chunk, store chunk in buffer
      // console.log(`GAP, next emitable ${this.nextEmittableChunkIndex}, received: ${d.i}`);
      this.buffer.push(d);
    }

    this.buffer.sort((a, b) => a.i - b.i);
    this.emitNextChunksInBuffer();

    // gap is too big, giving up on waiting for the chunk to be received
    if (this.buffer.length && this.buffer.length >= this.maxUnorderedChunks) {
      // console.log(`== gap too big, starting emitting, next emitable ${this.nextEmittableChunkIndex}`);
      if (this.buffer[0].i - this.nextEmittableChunkIndex === 1) {
        l(`Conceilling missing chunk ${this.nextEmittableChunkIndex}`);
        // there is only one missing chunk, we can send empty packet to let OPUS try to coneal this
        this.emitChunk({
          i: this.nextEmittableChunkIndex,
          chunk: Buffer.alloc(0),
        });
      }
      if (this.nextEmittableChunkIndex !== this.buffer[0].i) {
        l(`Missed ${this.buffer[0].i - this.nextEmittableChunkIndex} chunks, continuing without`);
      }
      // force consumming the buffer starting from the oldest chunk
      this.nextEmittableChunkIndex = this.buffer[0].i;
      this.emitNextChunksInBuffer();
    }

    if (cb) {
      cb();
    }

    return true;
  }
}

export class AudioChunkStreamResampler extends Minipass {
  resampler: SpeexResampler;

  constructor(public channels: number, public inRate: number, public outRate: number, public quality: number) {
    super({
      objectMode: true,
    });
    this.resampler = new SpeexResampler(channels, inRate, outRate, quality);
  }

  write(d: any, encoding?: string | (() => void), cb?: () => void) {
    const callback = typeof encoding === 'function' ? encoding : cb;
    const res = this.resampler.processChunk(d.chunk);
    super.write({
      i: d.i,
      chunk: res,
    });
    if (callback) {
      callback();
    }
    return true;
  }
}
