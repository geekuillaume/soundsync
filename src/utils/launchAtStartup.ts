import AutoLaunch from 'auto-launch';

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

export const enableAutolaunchAtStartup = () => {
  const autoLauncher = getAutoLauncherInstance();
  return autoLauncher.enable();
};

export const disableAutolaunchAtStartup = () => {
  const autoLauncher = getAutoLauncherInstance();
  return autoLauncher.disable();
};

export const isAutolaunchedAtStartup = () => {
  const autoLauncher = getAutoLauncherInstance();
  return autoLauncher.isEnabled();
};
