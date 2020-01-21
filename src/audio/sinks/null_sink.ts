import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';

export class NullSink extends AudioSink {
  local: true = true;
  type: 'null' = 'null';

  _startSink(source: AudioSource) {
  }
  _stopSink() {
  }
}
