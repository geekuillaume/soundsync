/* eslint-disable global-require */
import Electron from 'electron';

export const tryImportElectron = (): typeof Electron => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electron = require('electron');
    if (electron.app) {
      return electron;
    }
  } catch (e) {}
  return undefined;
};

export const onElectronReady = (callback: (electron: typeof Electron) => any) => {
  const electron = tryImportElectron();
  if (electron) {
    if (electron.app.isReady) {
      callback(electron);
    } else {
      electron.app.on('ready', () => {
        callback(electron);
      });
    }
  }
};
