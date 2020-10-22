import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import { l } from '../environment/log';
import { onExit } from '../on_exit';
import { getAudioServer } from './localAudioDevice';

const log = l.extend('loopbackDeviceManager');

const execPromisify = promisify(exec);

const loopbackCreators = {
  pulse: async () => {
    const sinks = (await execPromisify('pactl list short sinks'))
      .stdout.split('\n')
      .map((sinkInfo) => sinkInfo.split('\t'))
      .map(([index, name, module, info, status]) => ({
        index, name, module, info, status,
      })).filter(({ index }) => index.length);

    if (!sinks.some(({ name }) => name === 'soundsync_loopback')) {
      await execPromisify('pacmd load-module module-null-sink sink_name=soundsync_loopback channels=2 rate=48000 sink_properties=device.description=Soundsync');
    }
  },
};

const loopbackDeletors = {
  pulse: async () => {
    const modules = execSync('pactl list short modules')
      .toString().split('\n')
      .map((sinkInfo) => sinkInfo.split('\t'))
      .map(([index, name, infos]) => ({
        index, name, infos,
      }))
      .filter(({ name, infos }) => name === 'module-null-sink' && infos.includes('sink_name=soundsync_loopback'));

    if (modules.length) {
      await Promise.all(modules.map(async (module) => {
        log(`Deleting device with module id ${module.index}`);
        execSync(`pacmd unload-module ${module.index}`);
      }));
    }
  },
};

export const deleteLoopbackInterface = async () => {
  const audioServer = getAudioServer();
  const deletor = loopbackDeletors[audioServer.getApi()];
  if (deletor) {
    await deletor();
  }
};

export const createLoopbackInterface = async () => {
  const audioServer = getAudioServer();
  const creator = loopbackCreators[audioServer.getApi()];
  if (creator) {
    try {
      await creator();
      log(`Created loopback interface`);
      onExit(deleteLoopbackInterface);
    } catch (e) {
      log(`Error while creating loopback interface`, e);
    }
  } else {
    log(`Loopback interface creation not supported on ${audioServer.getApi()}`);
  }
};
