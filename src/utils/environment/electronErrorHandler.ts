import open from 'open';
import { Sentry } from '../vendor_integrations/sentry';
import { tryImportElectron } from './electron';

export const fatalErrorHandler = (e: Error) => {
  const electron = tryImportElectron();
  const dialogTitle = `There has been an error with Soundsync`;
  let dialogText = e.stack;
  if (e.stack && e.stack.includes('module could not be found') && process.platform === 'win32') {
    dialogText = `Please try installing Visual C++ 2019 redistributable from Microsoft website and try again.\nError details: ${e.stack}`;
    open('https://support.microsoft.com/en-us/help/2977003/the-latest-supported-visual-c-downloads');
  }
  // eslint-disable-next-line no-console
  console.error(e);
  Sentry.captureException(e);
  if (electron) {
    if (electron.app.isReady()) {
      const buttonIndex = electron.dialog.showMessageBoxSync({
        type: 'error',
        message: dialogTitle,
        detail: dialogText,
        buttons: [
          'Ok',
          'Copy error',
          'Report error on Github',
        ],
      });
      if (buttonIndex === 1) {
        electron.clipboard.writeText(e.stack);
      } else if (buttonIndex === 2) {
        open(`https://github.com/geekuillaume/soundsync/issues/new?body=${encodeURI(e.stack)}`);
      }
    } else {
      electron.dialog.showErrorBox(dialogTitle, dialogText);
    }
  }
  Sentry.close(2000).then(() => {
    process.exit(1);
  }).catch(() => {
    process.exit(1);
  });
};

process.on('uncaughtException', (e) => {
  fatalErrorHandler(e);
});

process.on('unhandledRejection', (e) => {
  fatalErrorHandler(e as any);
});
