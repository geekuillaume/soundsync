import { autoUpdater } from 'electron-updater';
import { l } from './log';

import { onElectronReady } from './electron';

const log = l.extend(`updater`);

export const installAutoUpdater = () => {
  onElectronReady(async () => {
    autoUpdater.logger = {
      info: log,
      warn: log,
      error: log,
    };
    log(`Updater starting, current version: ${autoUpdater.currentVersion}`);
    autoUpdater.on('update-available', (info) => {
      log(`Update available: ${info.version}`);
    });
    try {
      await autoUpdater.checkForUpdatesAndNotify();
    } catch (e) {
      log(`Error while checking for update: ${e.message}`);
    }
  });
};
