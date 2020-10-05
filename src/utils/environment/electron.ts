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
    electron.app.whenReady().then(() => {
      callback(electron);
    });
  }
};

export const isAnotherInstanceAlreadyRunning = (onSecondInstance?: () => void) => {
  const electron = tryImportElectron();
  if (!electron) {
    return false; // TODO: find another way to check for another instance if not using electron
  }
  const gotTheLock = electron.app.requestSingleInstanceLock();
  if (gotTheLock && onSecondInstance) {
    electron.app.on('second-instance', () => {
      onSecondInstance();
    });
  }
  return !gotTheLock;
};
