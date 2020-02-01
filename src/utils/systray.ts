import open from 'open';
import {app, Menu, Tray} from 'electron';
import { resolve } from 'path';

export const createSystray = () => {
  app.on('ready', () => {
    const tray = new Tray(resolve(__dirname, '../../res/logo_only.png'));
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open controller', type: 'normal', click: () => {
        open('http://127.0.0.1:6512');
      } },
      { label: 'Start on computer startup', type: 'normal', click: () => {
        console.log('startup')
      } },
      { label: 'Exit', type: 'normal', click: () => {
        process.exit(0);
      } }
    ]);
    tray.setTitle('Soundsync')
    tray.setContextMenu(contextMenu);
  });
}
