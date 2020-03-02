import SpeexResampler from 'speex-resampler';
import { OpusEncoder, OpusApplication, OpusDecoder } from 'audify';
import { Transform } from 'stream';
import {
  AudioChunkStream, AudioChunkStreamOutput, AudioChunkStreamEncoder, AudioChunkStreamDecoder,
} from '../utils/chunk_stream';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_SAMPLES_COUNT, OPUS_ENCODER_CHUNK_DURATION } from '../utils/constants';

export class OpusEncodeStream extends Transform {
  encoder: OpusEncoder;

  constructor(sampleRate: number, channels: number, application: OpusApplication) {
    super({
      objectMode: true,
    });
    this.encoder = new OpusEncoder(sampleRate, channels, application);
  }

  _transform(data: AudioChunkStreamOutput, encoding, callback) {
    const frame = this.encoder.encode(data.chunk, OPUS_ENCODER_CHUNK_SAMPLES_COUNT);
    callback(null, {
      i: data.i,
      chunk: frame,
    });
  }
}

export class OpusDecodeStream extends Transform {
  decoder: OpusDecoder;

  constructor(sampleRate: number, channels: number) {
    super({
      objectMode: true,
    });
    this.decoder = new OpusDecoder(sampleRate, channels);
  }

  _transform(data: AudioChunkStreamOutput, encoding, callback) {
    const decodedFrame: any = this.decoder.decode(data.chunk, OPUS_ENCODER_CHUNK_SAMPLES_COUNT);
    // decoder returns a promise when used with the WASM version in the browser
    // so we need to check if it is a promise or a chunk
    if (decodedFrame.then) {
      decodedFrame.then((chunk) => {
        callback(null, {
          i: data.i,
          chunk,
        });
      });
      return;
    }
    const output: AudioChunkStreamOutput = {
      i: data.i,
      chunk: decodedFrame,
    };
    callback(null, output);
  }
}

// This only works for a source stream encoded as 16bits integers
export const createAudioEncodedStream = (sourceStream: NodeJS.ReadableStream, sourceRate: number, channels: number) => {
  let source = sourceStream;
  if (sourceRate !== OPUS_ENCODER_RATE) {
    const resampler = new SpeexResampler.TransformStream(channels, sourceRate, OPUS_ENCODER_RATE);
    source = source.pipe(resampler);
  }
  const chunkStream = new AudioChunkStream(
    source,
    OPUS_ENCODER_CHUNK_DURATION,
    OPUS_ENCODER_CHUNK_SAMPLES_COUNT * channels * 2,
  ); // *2 because this is 16bits so 2 bytes
  const opusEncoderStream = new OpusEncodeStream(OPUS_ENCODER_RATE, channels, OpusApplication.OPUS_APPLICATION_AUDIO);
  const chunkEncoder = new AudioChunkStreamEncoder();
  return chunkStream
    .pipe(opusEncoderStream)
    .pipe(chunkEncoder);
};

export const createAudioDecodedStream = (encodedStream: NodeJS.ReadableStream, channels: number) => {
  const chunkDecoderStream = new AudioChunkStreamDecoder();
  const opusDecoderStream = new OpusDecodeStream(OPUS_ENCODER_RATE, channels);
  return encodedStream
    .pipe(chunkDecoderStream)
    .pipe(opusDecoderStream);
};
