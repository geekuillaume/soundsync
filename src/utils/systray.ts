import _ from 'lodash';
import open from 'open';
import { resolve } from 'path';
import {
  isAutolaunchedAtStartup,
  disableAutolaunchAtStartup,
  enableAutolaunchAtStartup,
} from './launchAtStartup';

let updateMenu;

export const refreshMenu = async () => {
  if (updateMenu) {
    await updateMenu();
  }
};

export const createSystray = () => {
  try {
    // eslint-disable-next-line
    const { app, Menu, Tray, nativeImage } = require('electron');
    app.on('ready', () => {
      try {
        const image = nativeImage.createFromPath(resolve(__dirname, '../../res/logo_small.png'));
        const tray = new Tray(image.resize({ width: 20, height: 20 })); // necessary for macos, else it will become huge in the systray

        const onAutostartClick = async () => {
          if (await isAutolaunchedAtStartup()) {
            await disableAutolaunchAtStartup();
          } else {
            await enableAutolaunchAtStartup();
          }
          await refreshMenu();
        };

        updateMenu = async () => {
          const template: any = _.compact([
            {
              label: 'Open Controller',
              click: () => {
                open(`http://localhost:6512`);
              },
            },
            {
              id: 'autostart', label: 'Start on computer startup', type: 'checkbox', click: onAutostartClick, checked: await isAutolaunchedAtStartup(),
            },
            {
              id: 'exit', label: 'Exit', type: 'normal', click: () => process.exit(0),
            },
          ]);

          const contextMenu = Menu.buildFromTemplate(template);

          tray.setContextMenu(contextMenu);
        };

        tray.setTitle('Soundsync');
        refreshMenu();
      } catch (e) {
        console.error(e);
      }
    });
    return true;
  } catch (e) {
    return false;
  }
};
