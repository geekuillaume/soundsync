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
    // autodownload crash process if there is an error during the new version download, we need to download it manually to catch the error
    autoUpdater.autoDownload = false;
    log(`Updater starting, current version: ${autoUpdater.currentVersion}`);
    autoUpdater.on('update-available', async (info) => {
      log(`Update available: ${info.version}`);
      try {
        await autoUpdater.downloadUpdate();
      } catch (e) {
        // ignore error, this will be logged by on('error') handler
      }
    });
    autoUpdater.on('error', (e) => {
      log(`Error while updating`, e);
    });
    try {
      await autoUpdater.checkForUpdates();
    } catch (e) {
      log(`Error while checking for update: ${e.message}`);
    }
  });
};
