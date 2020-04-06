import { AudioSink } from './audio_sink';

export class NullSink extends AudioSink {
  local: true = true;
  type: 'null' = 'null';

  _startSink() {
  }
  _stopSink() {
  }
  handleAudioChunk() {}
}
