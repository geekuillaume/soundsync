import MiniPass from 'minipass';
import { OpusEncoder, OpusApplication, OpusDecoder } from './opus';
import {
  AudioChunkStream, AudioChunkStreamOutput, AudioChunkStreamEncoder, AudioChunkStreamDecoder, AudioChunkStreamOrderer, AudioChunkStreamResampler,
} from './chunk_stream';
import {
  OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_DURATION, SPEEX_RESAMPLER_QUALITY, OPUS_ENCODER_CHUNKS_PER_SECONDS,
} from './constants';

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
      .then(() => this.encoder.encode(d.chunk))
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

export const createAudioEncodedStream = (startTime: number, sourceStream: NodeJS.ReadableStream, sourceRate: number, channels: number) => {
  const chunkStream = new AudioChunkStream(
    startTime,
    sourceStream,
    OPUS_ENCODER_CHUNK_DURATION,
    (sourceRate / OPUS_ENCODER_CHUNKS_PER_SECONDS) * channels * Uint16Array.BYTES_PER_ELEMENT,
  );
  let finalStream: MiniPass = chunkStream;
  if (sourceRate !== OPUS_ENCODER_RATE) {
    finalStream = finalStream.pipe(new AudioChunkStreamResampler(channels, sourceRate, OPUS_ENCODER_RATE, SPEEX_RESAMPLER_QUALITY));
  }
  const opusEncoderStream = new OpusEncodeStream(OPUS_ENCODER_RATE, channels, OpusApplication.OPUS_APPLICATION_AUDIO);
  const chunkEncoder = new AudioChunkStreamEncoder();
  return finalStream
    .pipe(opusEncoderStream)
    .pipe(chunkEncoder);
};

export const createAudioDecodedStream = (encodedStream: MiniPass, channels: number) => {
  const chunkDecoderStream = new AudioChunkStreamDecoder();
  const orderer = new AudioChunkStreamOrderer(10); // opus codec expect an ordered chunk stream but the webrtc datachannel is in unordered mode so we need to try to reorder them to prevent audio glitches
  const opusDecoderStream = new OpusDecodeStream(OPUS_ENCODER_RATE, channels);
  return encodedStream
    .pipe(chunkDecoderStream)
    .pipe(orderer)
    .pipe(opusDecoderStream);
};
