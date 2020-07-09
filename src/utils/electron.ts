/* eslint-disable global-require */
import electron from 'electron';

export const onElectronReady = (callback: (Electron: typeof electron) => any) => {
  if (electron.app) {
    electron.app.on('ready', () => {
      callback(electron);
    });
  }
};
