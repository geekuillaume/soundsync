import _ from 'lodash';
import open from 'open';
import { resolve } from 'path';
import { getPeersManager } from '../communication/peers_manager';
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
    const { app, Menu, Tray } = require('electron');
    app.on('ready', () => {
      try {
        const tray = new Tray(resolve(__dirname, '../../res/logo_small.png'));

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
            // getPeersManager().coordinatorPeer && {
            //   label: 'Open Controller',
            //   click: () => {
            //     open(`http://${getPeersManager().coordinatorPeer.host}`);
            //   },
            // },
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
