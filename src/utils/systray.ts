import open from 'open';
import {app, Menu, Tray} from 'electron';
import { resolve } from 'path';
import AutoLaunch from 'auto-launch';

const autoLauncher = new AutoLaunch({
  name: 'Soundsync',
});

export const createSystray = () => {
  app.on('ready', () => {
    const tray = new Tray(resolve(__dirname, '../../res/logo_only.png'));

    const onAutostartClick = async () => {
      if (await autoLauncher.isEnabled()) {
        await autoLauncher.disable();
      } else {
        await autoLauncher.enable();
      }
      await updateAutostartStatus();
    }

    const updateAutostartStatus = async () => {
      contextMenu.getMenuItemById('autostart').checked = await autoLauncher.isEnabled();
    }

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Open controller', type: 'normal', click: () => {
        open('http://127.0.0.1:6512');
      } },
      { id: 'autostart', label: 'Start on computer startup', type: 'checkbox', click: onAutostartClick },
      { label: 'Exit', type: 'normal', click: () => {
        process.exit(0);
      } }
    ]);
    tray.setTitle('Soundsync')
    tray.setContextMenu(contextMenu);

    updateAutostartStatus();
  });
}
