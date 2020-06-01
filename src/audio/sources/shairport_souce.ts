import _ from 'lodash';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { hostname } from 'os';
import { dirname } from 'path';
import { AudioSource } from './audio_source';
import { ShairportSourceDescriptor } from './source_type';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { createAudioEncodedStream } from '../../utils/opus_streams';
import { ensureDep } from '../../utils/deps_downloader';
import { AudioInstance } from '../utils';

export class ShairportSource extends AudioSource {
  local = true;
  rate = 44100;
  channels = 2;

  options: ShairportSourceDescriptor['shairportOptions'];
  shairportProcess: ChildProcessWithoutNullStreams;

  constructor(descriptor: ShairportSourceDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.options = _.clone(descriptor.shairportOptions) || {};
    this.options.name = this.options.name || hostname();
    this.start(); // start right away to let devices detect and send audio to the shairport process
  }

  async _getAudioEncodedStream() {
    const shairportPath = await ensureDep('shairport');
    this.log(`Starting shairport process`);
    this.shairportProcess = spawn(shairportPath, [
      '-a', this.options.name,
      '-o', 'stdout',
      '-p', String(_.random(5000, 5100, false)), // we select a random port to allow use of multiple shairport instance on the same host
      ...(this.options.debug ? ['-v', '-u'] : []),
    ], {
      env: {
        LD_LIBRARY_PATH: dirname(shairportPath),
        DYLD_LIBRARY_PATH: dirname(shairportPath),
      },
    });
    const shairportLog = this.log.extend('shairport');
    this.shairportProcess.stderr.on('data', (d) => shairportLog(d.toString()));
    this.shairportProcess.on('exit', (code) => {
      this.log('Shairport excited with code:', code);
    });

    return createAudioEncodedStream(this.shairportProcess.stdout, this.rate, this.channels);
  }

  _stop = () => {
    this.shairportProcess.kill();
    delete this.shairportProcess;
  }

  toDescriptor = (sanitizeForConfigSave = false): AudioInstance<ShairportSourceDescriptor> => ({
    type: 'shairport',
    name: this.name,
    uuid: this.uuid,
    shairportOptions: this.options,
    channels: this.channels,

    ...(!sanitizeForConfigSave && {
      peerUuid: this.peerUuid,
      instanceUuid: this.instanceUuid,
      latency: this.latency,
      startedAt: this.startedAt,
      available: true, // TODO: check if shairport process is still running to get availability state
    }),
  })
}
