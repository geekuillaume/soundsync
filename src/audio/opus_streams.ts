import { OpusEncoder, OpusApplication, OpusDecoder } from 'audify';
import { Transform } from 'stream';
import { ChunkStream } from '../utils/chunk_stream';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_FRAME_SAMPLES_COUNT } from '../utils/constants';

export const createOpusEncoder = (sourceStream: NodeJS.ReadableStream, channels: number) => {
  // Todo handle streams that are not with a 48000 rate
  const chunkStream = new ChunkStream(OPUS_ENCODER_FRAME_SAMPLES_COUNT * channels * 2); // *2 because this is 16bits so 2 bytes
  const opusEncoderStream = new OpusEncodeStream(OPUS_ENCODER_RATE, channels, OpusApplication.OPUS_APPLICATION_AUDIO)
  return sourceStream.pipe(chunkStream).pipe(opusEncoderStream);
}

export class OpusEncodeStream extends Transform {
  encoder: OpusEncoder;

  constructor(sampleRate: number, channels: number, application: OpusApplication) {
    super();
    this.encoder = new OpusEncoder(sampleRate, channels, application);
  }

  _transform(data: Buffer, encoding, callback) {
    const frame = this.encoder.encode(data, OPUS_ENCODER_FRAME_SAMPLES_COUNT);
    callback(null, frame);
  }
}

export class OpusDecodeStream extends Transform {
  decoder: OpusDecoder;

  constructor(sampleRate: number, channels: number) {
    super();
    this.decoder = new OpusDecoder(sampleRate, channels);
  }

  _transform(data: Buffer, encoding, callback) {
    const decodedFrame = this.decoder.decode(data, OPUS_ENCODER_FRAME_SAMPLES_COUNT);
    callback(null, decodedFrame);
  }
}
