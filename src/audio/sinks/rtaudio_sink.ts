// import Speaker from 'speaker';
import { AudioSink } from './audio_sink';
import { AudioSource } from '../sources/audio_source';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_FRAME_SAMPLES_COUNT, OPUS_ENCODER_SAMPLES_PER_SECONDS } from '../../utils/constants';
import { RtAudioSinkDescriptor } from './sink_type';
import { RtAudio, RtAudioFormat, RtAudioStreamFlags } from 'audify';
import { AudioChunkStreamOutput } from '../../utils/chunk_stream';

export class RtAudioSink extends AudioSink {
  type: 'rtaudio' = 'rtaudio';
  deviceName: string;

  rtaudio: RtAudio;
  // @ts-ignore
  // speaker: Speaker;

  constructor(descriptor: RtAudioSinkDescriptor) {
    super(descriptor);
    this.local = true;
    this.rtaudio = new RtAudio();

  }

  _startSink(source: AudioSource) {
    this.log(`Creating speaker`);
    this.rtaudio.openStream(
      {nChannels: source.channels}, // output stream
      null, // input stream
      RtAudioFormat.RTAUDIO_SINT16, // format
      OPUS_ENCODER_RATE, // rate
      OPUS_ENCODER_FRAME_SAMPLES_COUNT, // samples per frame
      `soundsync-${source.name}`, // name
      null, // input callback, not used
      // RtAudioStreamFlags.RTAUDIO_MINIMIZE_LATENCY // stream flags
    );
    setTimeout(() => {
      this.log('Starting reading chunks');
      this.rtaudio.start();
    }, 2500);
    setInterval(this.writeNextAudioChunk, 1000 / OPUS_ENCODER_SAMPLES_PER_SECONDS);
  }

  _stopSink() {
    // TODO: implement sink stop
  }

  writeNextAudioChunk = () => {
    const chunk = this.getAudioChunkAtDelayFromNow(0);
    this.rtaudio.write(chunk);
  }

}
