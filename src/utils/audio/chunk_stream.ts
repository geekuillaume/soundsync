import Minipass from 'minipass';
import debug from 'debug';
import SoxrResampler, { SoxrDatatype } from 'wasm-audio-resampler';
import { now } from '../misc';
import {
  OPUS_ENCODER_CHUNK_DURATION, OPUS_ENCODER_CHUNKS_PER_SECONDS, OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_SAMPLES_COUNT,
} from '../constants';
import { OpusApplication } from './opus';
import { OpusEncodeStream, OpusDecodeStream } from './opus_streams';

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
    const input = d as Buffer;
    const returnVal = super.write({
      i: input.readUInt32LE(0),
      // this is necessary to make a copy of the buffer instead of creating a view to the same data
      chunk: Buffer.from(Uint8Array.prototype.slice.apply(input, [4]).buffer),
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
  resampler: SoxrResampler;

  constructor(public channels: number, public inRate: number, public outRate: number) {
    super({
      objectMode: true,
    });
    this.resampler = new SoxrResampler(channels, inRate, outRate, SoxrDatatype.SOXR_INT16);
  }

  write(d: any, encoding?: string | (() => void), cb?: () => void) {
    const callback = typeof encoding === 'function' ? encoding : cb;
    const res = this.resampler.processChunk(d.chunk);
    if (res.length === OPUS_ENCODER_CHUNK_SAMPLES_COUNT * this.channels * Uint16Array.BYTES_PER_ELEMENT) {
      super.write({
        i: d.i,
        chunk: res,
      });
    } else {
      // length can be different than target chunk length if the stream is starting and the resampler doesn't have enough data to start the process
      // in this case, we just ignore the chunk
      // TODO: store incomplete chunk and use data from next chunk to complete it
    }
    if (callback) {
      callback();
    }
    return true;
  }
}

export class AudioFloatTransformer extends Minipass {
  write(d: any) {
    const data = d as AudioChunkStreamOutput;
    const input = new Int16Array(data.chunk.buffer);
    const output = new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      output[i] = input[i] / 32768;
    }

    super.write({
      i: data.i,
      chunk: Buffer.from(output.buffer),
    });
    return true;
  }
}

export const createAudioChunkStream = (startTime: number, sourceStream: NodeJS.ReadableStream, sourceRate: number, channels: number) => {
  const chunkStream = new AudioChunkStream(
    startTime,
    sourceStream,
    OPUS_ENCODER_CHUNK_DURATION,
    (sourceRate / OPUS_ENCODER_CHUNKS_PER_SECONDS) * channels * Uint16Array.BYTES_PER_ELEMENT,
  );
  let finalStream: Minipass = chunkStream;
  if (sourceRate !== OPUS_ENCODER_RATE) {
    finalStream = finalStream.pipe(new AudioChunkStreamResampler(channels, sourceRate, OPUS_ENCODER_RATE));
  }
  const audioFloatTransformer = new AudioFloatTransformer();
  return finalStream
    .pipe(audioFloatTransformer);
  // .pipe(opusEncoderStream)
  // .pipe(chunkEncoder);
};

export const createAudioEncodedStream = (channels: number) => {
  const opusEncoderStream = new OpusEncodeStream(OPUS_ENCODER_RATE, channels, OpusApplication.OPUS_APPLICATION_AUDIO);
  const chunkEncoder = new AudioChunkStreamEncoder();
  opusEncoderStream.pipe(chunkEncoder);
  return { input: opusEncoderStream, output: chunkEncoder };
};

export const createAudioDecodedStream = (channels: number) => {
  const chunkDecoderStream = new AudioChunkStreamDecoder();
  const orderer = new AudioChunkStreamOrderer(10); // opus codec expect an ordered chunk stream but the webrtc datachannel is in unordered mode so we need to try to reorder them to prevent audio glitches
  const opusDecoderStream = new OpusDecodeStream(OPUS_ENCODER_RATE, channels);
  chunkDecoderStream.pipe(orderer).pipe(opusDecoderStream);
  return { input: chunkDecoderStream, output: opusDecoderStream };
};
