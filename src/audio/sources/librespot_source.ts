import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { clone } from 'lodash';
import { hostname } from 'os';
import { AudioSource } from './audio_source';
import { LibresportSourceDescriptor } from './source_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { createAudioChunkStream } from '../../utils/audio/chunk_stream';
import { ensureDep } from '../../utils/environment/deps_downloader';
import { AudioInstance } from '../utils';

const LIBRESPOT_STDERR_BUFFER_SIZE = 5000; // keep the last 5000 characters from the librespot process stderr

export class LibrespotSource extends AudioSource {
  local = true;
  rate = 44100;
  channels = 2;
  processStderrBuffer = '';

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
      '-A',
      '-v',
      ...(this.options.bitrate ? ['-b', String(this.options.bitrate)] : []),
      ...(this.options.username ? [
        '-u', this.options.username,
        '-p', this.options.password,
      ] : []),
    ]);
    if (this.librespotProcess.pid === undefined) {
      throw new Error('Unknown error while starting Librespot');
    }
    this.librespotProcess.on('error', (e) => {
      this.log('Error while starting librespot process', e);
      this.updateInfo({
        error: e.toString(),
      });
    });
    const librespotLog = this.log.extend('librespot');
    this.librespotProcess.stderr.on('data', (d) => {
      this.processStderrBuffer += d.toString();
      if (this.processStderrBuffer.length > LIBRESPOT_STDERR_BUFFER_SIZE) {
        this.processStderrBuffer = this.processStderrBuffer.slice(this.processStderrBuffer.length - LIBRESPOT_STDERR_BUFFER_SIZE);
      }
      librespotLog(d.toString());
    });
    this.librespotProcess.on('exit', (code) => {
      this.log('Librespot exited with code:', code, this.processStderrBuffer);
      if (code) {
        this.updateInfo({
          error: code === 101
            ? `Spotify username or password invalid`
            : `Spotify process exited with error code ${code}: ${this.processStderrBuffer}`,
        });
      }
    });

    return createAudioChunkStream(this.startedAt, this.librespotProcess.stdout, this.rate, this.channels);
  }

  _stop = () => {
    if (this.librespotProcess) {
      this.librespotProcess.kill();
    }
    this.processStderrBuffer = '';
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
      error: this.error,
      peerUuid: this.peerUuid,
      latency: this.latency,
      startedAt: this.startedAt,
      available: true, // TODO: check if librespot process is still running to get availability state
      active: this.active,
      started: this.started,
    }),
  })
}
