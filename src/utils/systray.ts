// import open from 'open';
import { resolve } from 'path';
import AutoLaunch from 'auto-launch';
import {
  getDetectedCoordinators, onDetectionChange, actAsCoordinator, actAsClientOfCoordinator,
} from '../communication/coordinatorDetector';
import { isCoordinator, getWebrtcServer } from '../communication/wrtc_server';

let updateMenu;

export const refreshMenu = async () => {
  if (updateMenu) {
    await updateMenu();
  }
};

export const createSystray = () => {
  try {
    const autoLauncher = new AutoLaunch({
      name: 'Soundsync',
    });

    // eslint-disable-next-line
    const { app, Menu, Tray } = require('electron');
    app.on('ready', () => {
      try {
        const tray = new Tray(resolve(__dirname, '../../res/logo_only.png'));

        const onAutostartClick = async () => {
          if (await autoLauncher.isEnabled()) {
            await autoLauncher.disable();
          } else {
            await autoLauncher.enable();
          }
          await refreshMenu();
        };

        updateMenu = async () => {
          const template: any = [
            { type: 'separator' },
            {
              id: 'autostart', label: 'Start on computer startup', type: 'checkbox', click: onAutostartClick, checked: await autoLauncher.isEnabled(),
            },
            {
              id: 'exit', label: 'Exit', type: 'normal', click: () => process.exit(0),
            },
          ];

          if (isCoordinator()) {
            template.unshift({ label: 'Started as coordinator', enabled: false });
          } else if (!getWebrtcServer().coordinatorPeer) {
            const detectedCoordinators = getDetectedCoordinators();
            template.unshift(...(detectedCoordinators.length
              ? detectedCoordinators.map((coordinator) => ({
                label: `  ${coordinator.host}`,
                type: 'normal',
                // @ts-ignore
                click: () => actAsClientOfCoordinator(`${coordinator.addresses[0]}:${coordinator.port}`),
              }))
              : [{ label: '  Scanning...', type: 'normal', enabled: false }]));
            template.unshift({ label: 'Select a coordinator:', enabled: false });
            template.unshift({ label: 'Start a new coordinator', click: actAsCoordinator });
          } else {
            template.unshift({
              label: `Connected to ${getWebrtcServer().coordinatorPeer.name}`,
              enabled: false,
            });
          }

          // @ts-ignore
          const contextMenu = Menu.buildFromTemplate(template);

          // { label: 'Open controller', type: 'normal', click: () => {
          //   open('http://127.0.0.1:6512');
          // } },
          tray.setContextMenu(contextMenu);
        };

        tray.setTitle('Soundsync');
        onDetectionChange(refreshMenu);
        refreshMenu();
      } catch (e) {
        console.error(e);
      }
    });
  } catch (e) {}
};
