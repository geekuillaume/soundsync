import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { hostname } from 'os';
import { AudioSource } from './audio_source';
import { LibresportSourceDescriptor } from './source_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { createAudioEncodedStream } from '../../utils/opus_streams';
import { ensureDep } from '../../utils/deps_downloader';
import { AudioInstance } from '../utils';

export class LibrespotSource extends AudioSource {
  local = true;
  rate = 44100;
  channels = 2;

  options: LibresportSourceDescriptor['librespotOptions'];
  librespotProcess: ChildProcessWithoutNullStreams;

  constructor(descriptor: LibresportSourceDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.options = descriptor.librespotOptions || {};
    this.options.name = this.options.name || hostname();
    this.start(); // start right away to consume librespot chunks even when there is no sink connected
  }

  async _getAudioEncodedStream() {
    const librespotPath = await ensureDep('librespot');
    this.log(`Starting librespot process`);
    this.librespotProcess = spawn(librespotPath, [
      '-n', this.options.name,
      '--backend', 'pipe',
      '--initial-volume', '100',
      '-v',
      ...(this.options.bitrate ? ['-b', String(this.options.bitrate)] : []),
      ...(this.options.username ? [
        '-u', this.options.username,
        '-p', this.options.password,
      ] : []),
    ]);
    const librespotLog = this.log.extend('librespot');
    this.librespotProcess.stderr.on('data', (d) => librespotLog(d.toString()));
    this.librespotProcess.on('exit', (code) => {
      this.log('Librespot excited with code:', code);
    });

    return createAudioEncodedStream(this.librespotProcess.stdout, this.rate, this.channels);
  }

  _stop = () => {
    this.librespotProcess.kill();
    delete this.librespotProcess;
  }

  toDescriptor: (() => AudioInstance<LibresportSourceDescriptor>) = () => ({
    type: 'librespot',
    name: this.name,
    uuid: this.uuid,
    librespotOptions: this.options,
    peerUuid: this.peerUuid,
    instanceUuid: this.instanceUuid,
    channels: this.channels,
    latency: this.latency,
    startedAt: this.startedAt,
  })
}
