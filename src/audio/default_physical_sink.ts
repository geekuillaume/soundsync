import {Speaker} from 'speaker';
import { AudioSink } from './audio_sink';
import { AudioSource } from './audio_source';
import { OPUS_ENCODER_RATE } from '../utils/constants';
import { LocalSinkDescriptor } from './sink_type';

export class DefaultPhysicalSink extends AudioSink {
  speaker: Speaker;

  constructor(descriptor: LocalSinkDescriptor) {
    super(descriptor);
    this.local = true;
  }

  _startBackend(source: AudioSource) {
    this.log(`Creating speaker`);
    this.speaker = new Speaker({
      channels: source.channels,
      bitDepth: 16,
      sampleRate: OPUS_ENCODER_RATE,
    });
  }

  _pipeDecoderToBackend(decoderStream: NodeJS.ReadableStream) {
    this.log(`Piping decoder to speaker`);
    decoderStream.pipe(this.speaker);
  }

  _unpipeDecoderToBackend() {
    if (this.decoder) {
      this.log(`Unpiping decoder to speaker`);
      this.decoder.unpipe(this.speaker);
    }
  }

}
