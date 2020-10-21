import { autoUpdater } from 'electron-updater';
import debug from 'debug';

import { onElectronReady } from './electron';

const l = debug(`soundsync:updater`);

export const installAutoUpdater = () => {
  onElectronReady(async () => {
    autoUpdater.logger = {
      info: l,
      warn: l,
      error: l,
    };
    l(`Updater starting, current version: ${autoUpdater.currentVersion}`);
    autoUpdater.on('update-available', (info) => {
      l(`Update available: ${info.version}`);
    });
    try {
      await autoUpdater.checkForUpdatesAndNotify();
    } catch (e) {
      l(`Error while checking for update: ${e.message}`);
    }
  });
};
