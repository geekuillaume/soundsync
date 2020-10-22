import AutoLaunch from 'auto-launch';
import { l } from './log';

const log = l.extend(`launchAtStartup`);

const autoLaunchMock = {
  enable: () => Promise.resolve(),
  disable: () => Promise.resolve(),
  isEnabled: () => Promise.resolve(false),
};

let _autoLauncher: AutoLaunch;
const getAutoLauncherInstance = () => {
  if (!_autoLauncher) {
    try {
      _autoLauncher = new AutoLaunch({
        name: 'Soundsync',
      });
    } catch (e) {
      _autoLauncher = autoLaunchMock;
    }
  }
  return _autoLauncher;
};

export const enableAutolaunchAtStartup = async () => {
  const autoLauncher = getAutoLauncherInstance();
  try {
    await autoLauncher.enable();
  } catch (e) {
    log(`Error while enabling autolaunch at startup`, e);
  }
};

export const disableAutolaunchAtStartup = async () => {
  const autoLauncher = getAutoLauncherInstance();
  try {
    await autoLauncher.disable();
  } catch (e) {
    log(`Error while disabling autolaunch at startup`, e);
  }
};

export const isAutolaunchedAtStartup = async () => {
  const autoLauncher = getAutoLauncherInstance();
  try {
    return await autoLauncher.isEnabled();
  } catch (e) {
    log(`Error while detecting if autolaunch is enabled`, e);
    return false;
  }
};
