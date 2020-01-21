import { AudioSource } from './audio_source';
import { createAudioEncodedStream } from '../opus_streams';
import { OPUS_ENCODER_RATE } from '../../utils/constants';
import { Readable } from 'stream';

export class NullSource extends AudioSource {
  local = true;

  async _getAudioEncodedStream() {
    const nullStream = new Readable({
      read() {
        while (true) {
          const res = this.push(Buffer.alloc(44100));
          if (!res) {
            return;
          }
        }
      }
    })
    const stream = createAudioEncodedStream(nullStream, OPUS_ENCODER_RATE, 2);
    return stream;
  }
}
