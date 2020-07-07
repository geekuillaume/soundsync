/* eslint-disable global-require */
import Electron from 'electron';

export const onElectronReady = (callback: (electron: typeof Electron) => any) => {
  import('electron').then((electron) => {
    if (electron.app) {
      electron.app.on('ready', () => {
        callback(electron);
      });
    }
  });
};
