const { notarize } = require('electron-notarize');

exports.default = (context) => {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return null;
  }

  const appName = context.packager.appInfo.productFilename;

  return notarize({
    appBundleId: 'com.geekuillaume.soundsync',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
  });
};
