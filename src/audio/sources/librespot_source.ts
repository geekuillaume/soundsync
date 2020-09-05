import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { clone } from 'lodash';
import { hostname } from 'os';
import { AudioSource } from './audio_source';
import { LibresportSourceDescriptor } from './source_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { createAudioChunkStream } from '../../utils/audio/chunk_stream';
import { ensureDep } from '../../utils/environment/deps_downloader';
import { AudioInstance } from '../utils';

export class LibrespotSource extends AudioSource {
  local = true;
  rate = 44100;
  channels = 2;

  options: LibresportSourceDescriptor['librespotOptions'];
  librespotProcess: ChildProcessWithoutNullStreams;

  constructor(descriptor: LibresportSourceDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.options = clone(descriptor.librespotOptions) || {};
    this.options.name = this.options.name || hostname();
    this.startReading(); // start right away to consume librespot chunks even when there is no sink connected
  }

  async _getAudioChunkStream() {
    const librespotPath = await ensureDep('librespot');
    this.log(`Starting librespot process`);
    this.librespotProcess = spawn(librespotPath, [
      '-n', this.options.name,
      '--backend', 'pipe',
      '--initial-volume', '100',
      '--enable-volume-normalisation',
      '-v',
      ...(this.options.bitrate ? ['-b', String(this.options.bitrate)] : []),
      ...(this.options.username ? [
        '-u', this.options.username,
        '-p', this.options.password,
      ] : []),
    ]);
    if (this.librespotProcess.pid === undefined) {
      throw new Error('Process didn\'t started');
    }
    this.librespotProcess.on('error', (e) => {
      this.log('Error while starting librespot process', e);
    });
    const librespotLog = this.log.extend('librespot');
    this.librespotProcess.stderr.on('data', (d) => librespotLog(d.toString()));
    this.librespotProcess.on('exit', (code) => {
      this.log('Librespot exited with code:', code);
    });

    return createAudioChunkStream(this.startedAt, this.librespotProcess.stdout, this.rate, this.channels);
  }

  _stop = () => {
    this.librespotProcess.kill();
    delete this.librespotProcess;
  }

  toDescriptor = (sanitizeForConfigSave = false): AudioInstance<LibresportSourceDescriptor> => ({
    type: 'librespot',
    name: this.name,
    uuid: this.uuid,
    librespotOptions: this.options,
    instanceUuid: this.instanceUuid,
    channels: this.channels,

    ...(!sanitizeForConfigSave && {
      peerUuid: this.peerUuid,
      latency: this.latency,
      startedAt: this.startedAt,
      available: true, // TODO: check if librespot process is still running to get availability state
      active: this.active,
      started: this.started,
    }),
  })
}
