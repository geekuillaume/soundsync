import { AudioSource } from './audio_source';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { hostname } from 'os';
import { LibresportSourceDescriptor } from './source_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { createAudioEncodedStream } from '../opus_streams';

export class LibrespotSource extends AudioSource {
  options: LibresportSourceDescriptor['librespotOptions'];
  librespotProcess: ChildProcessWithoutNullStreams;
  encoderStream: NodeJS.WritableStream;

  constructor(descriptor: LibresportSourceDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.options = descriptor.librespotOptions;
    this.options.name = this.options.name || hostname();
    this.local = true;
    this.rate = 44100;

    this.log(`Starting librespot process`);
    this.librespotProcess = spawn(`librespot`, [
      '-n', this.options.name,
      '--backend', 'pipe',
      '--initial-volume', '100',
      '-v',
      ...(this.options.bitrate ? ['-b', String(this.options.bitrate)] : []),
      ...(this.options.username ? [
        '-u', this.options.username,
        '-p', this.options.password,
      ] : [])
    ]);
  }

  async _getAudioEncodedStream() {
    return createAudioEncodedStream(this.librespotProcess.stdout, this.rate, this.channels)
  }
}
