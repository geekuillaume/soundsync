import Speaker from 'speaker';
import { AudioSink } from './audio_sink';
import { AudioSource } from './audio_source';
import { OPUS_ENCODER_RATE } from '../utils/constants';
import { LocalSinkDescriptor } from './sink_type';

export class DefaultPhysicalSink extends AudioSink {
  // @ts-ignore
  speaker: Speaker;

  constructor(descriptor: LocalSinkDescriptor) {
    super(descriptor);
    this.local = true;
  }

  _startSink(source: AudioSource) {
    this.log(`Creating speaker`);
    // @ts-ignore
    this.speaker = new Speaker({
      channels: source.channels,
      bitDepth: 16,
      sampleRate: OPUS_ENCODER_RATE,
    });
  }

  _pipeSourceStreamToSink(sourceStream: NodeJS.ReadableStream) {
    this.log(`Piping decoder to speaker`);
    sourceStream.pipe(this.speaker);
  }

  _unpipeSourceStreamToSink() {
    // if (this.decoder) {
    //   this.log(`Unpiping decoder to speaker`);
    //   this.decoder.unpipe(this.speaker);
    // }
  }

}
