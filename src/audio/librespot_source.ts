import { AudioSource } from './audio_source';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { hostname } from 'os';
import { LibresportSourceDescriptor } from './source_type';

export class LibrespotSource extends AudioSource {
  options: LibresportSourceDescriptor['librespotOptions'];
  librespotProcess: ChildProcessWithoutNullStreams;
  encoderStream: NodeJS.WritableStream;

  constructor(descriptor: LibresportSourceDescriptor) {
    super(descriptor);
    this.options = descriptor.librespotOptions;
    this.options.name = this.options.name || hostname();
    this.local = true;

    this.log(`Starting librespot process`);
    // this.librespotProcess = spawn(`librespot`, [
    //   '-n', this.options.name,
    //   '--backend', 'pipe',
    //   ...(this.options.bitrate ? ['-b', String(this.options.bitrate)] : []),
    //   ...(this.options.username ? [
    //     '-u', this.options.username,
    //     '-p', this.options.password,
    //   ] : [])
    // ]);
    this.librespotProcess = spawn(`pacat`, [
      '-r', '--raw', '--rate=48000'
    ]);
  }

  _startBackend() {
    return this.librespotProcess.stdout;
  }
}
