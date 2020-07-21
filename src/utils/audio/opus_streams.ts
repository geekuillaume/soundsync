import MiniPass from 'minipass';
import { OpusEncoder, OpusApplication, OpusDecoder } from './opus';
import {
  AudioChunkStreamOutput,
} from './chunk_stream';

export class OpusEncodeStream extends MiniPass {
  encoder: OpusEncoder;
  readyPromise: Promise<unknown>;

  constructor(sampleRate: number, channels: number, application: OpusApplication) {
    super({
      objectMode: true,
    });
    this.encoder = new OpusEncoder(sampleRate, channels, application);
    this.readyPromise = this.encoder.setup();
  }

  write(d: any, encoding?: string | (() => void), cb?: () => void) {
    this.readyPromise
      .then(() => this.encoder.encodeFloat(d.chunk))
      .then((frame) => {
        if (this.emittedEnd) {
          return;
        }

        super.write({
          i: d.i,
          chunk: frame,
        });
        if (cb) {
          cb();
        }
      });

    return true;
  }
}

export class OpusDecodeStream extends MiniPass {
  decoder: OpusDecoder;
  readyPromise: Promise<unknown>;

  constructor(sampleRate: number, channels: number) {
    super({
      objectMode: true,
    });
    this.decoder = new OpusDecoder(sampleRate, channels);
    this.readyPromise = this.decoder.setup();
  }

  async _handleChunk(d: AudioChunkStreamOutput, cb?: () => void) {
    await this.readyPromise;
    if (this.emittedEnd) {
      return;
    }
    const decodedFrame = this.decoder.decodeFloat(d.chunk);
    super.write({
      i: d.i,
      chunk: Buffer.from(decodedFrame),
    });
    if (cb) {
      cb();
    }
  }

  write(d: any, encoding?: string | (() => void), cb?: () => void) {
    this._handleChunk(d, cb);
    return true;
  }
}
