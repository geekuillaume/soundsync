import { Readable } from 'stream';
import { createReadStream, exists } from 'fs';
import { promisify } from 'util';
import { AudioSource } from './audio_source';
import { createAudioChunkStream } from '../../utils/audio/chunk_stream';
import { OPUS_ENCODER_RATE } from '../../utils/constants';

export class NullSource extends AudioSource {
  local = true;
  rate = 44100;
  channels = 2;

  async _getAudioChunkStream() {
    // Used for testing purposes, will use the test.pcm file which should be a 44.1kHz 2 channels PCM file
    if (await promisify(exists)('./test.pcm')) {
      return createAudioChunkStream(this.startedAt, createReadStream('./test.pcm'), this.rate, this.channels);
    }
    const nullStream = new Readable({
      read() {
        while (true) {
          const res = this.push(Buffer.alloc(44100));
          if (!res) {
            return;
          }
        }
      },
    });
    const stream = createAudioChunkStream(this.startedAt, nullStream, OPUS_ENCODER_RATE, 2);
    return stream;
  }
}
