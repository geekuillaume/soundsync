import { autoUpdater } from 'electron-updater';
import debug from 'debug';

import { onElectronReady } from './electron';

const l = debug(`soundsync:updater`);

export const installAutoUpdater = () => {
  onElectronReady(() => {
    autoUpdater.logger = {
      info: l,
      warn: l,
      error: l,
    };
    l(`Updater starting, current version: ${autoUpdater.currentVersion}`);
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-available', (info) => {
      l(`Update available: ${info.version}`);
    });
  });
};
