import open from 'open';
import { resolve } from 'path';
import { onElectronReady } from './electron';
import {
  isAutolaunchedAtStartup,
  disableAutolaunchAtStartup,
  enableAutolaunchAtStartup,
} from './launchAtStartup';
import { Sentry } from './sentry';

let updateMenu;

export const refreshMenu = async () => {
  if (updateMenu) {
    await updateMenu();
  }
};

export const createSystray = () => {
  onElectronReady((electron) => {
    try {
      const {
        Menu, Tray, nativeImage,
      } = electron;
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
        const template: any = [
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
        ];

        const contextMenu = Menu.buildFromTemplate(template);

        tray.setContextMenu(contextMenu);
      };

      tray.setTitle('Soundsync');
      refreshMenu();
    } catch (e) {
      console.error(e);
      Sentry.captureException(e);
    }
  });
};
