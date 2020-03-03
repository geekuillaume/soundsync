import _ from 'lodash';
import open from 'open';
import { resolve } from 'path';
import {
  getDetectedCoordinators, onDetectionChange, actAsCoordinator, actAsClientOfCoordinator,
} from '../communication/coordinatorDetector';
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
            { type: 'separator' },
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

          // if (isCoordinator()) {
          //   template.unshift({ label: 'Started as coordinator', enabled: false });
          // } else if (!getPeersManager().coordinatorPeer) {
          //   const detectedCoordinators = getDetectedCoordinators();
          //   template.unshift(...(detectedCoordinators.length
          //     ? detectedCoordinators.map((coordinator) => ({
          //       label: `  ${coordinator.host}`,
          //       type: 'normal',
          //       // @ts-ignore
          //       click: () => actAsClientOfCoordinator(`${coordinator.addresses[0]}:${coordinator.port}`),
          //     }))
          //     : [{ label: '  Scanning...', type: 'normal', enabled: false }]));
          //   template.unshift({ label: 'Select a coordinator:', enabled: false });
          //   template.unshift({ label: 'Start a new coordinator', click: actAsCoordinator });
          // } else {
          //   template.unshift({
          //     label: `Connected to ${getPeersManager().coordinatorPeer.name}`,
          //     enabled: false,
          //   });
          // }

          const contextMenu = Menu.buildFromTemplate(template);

          tray.setContextMenu(contextMenu);
        };

        tray.setTitle('Soundsync');
        onDetectionChange(refreshMenu);
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
