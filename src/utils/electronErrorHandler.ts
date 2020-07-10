import electron from 'electron';
import open from 'open';
import { Sentry } from './sentry';

const isFromElectron = !!electron.app;

export const fatalErrorHandler = (e: Error) => {
  const dialogTitle = `There has been an error with Soundsync`;
  let dialogText = e.stack;
  if (e.stack.includes('module could not be found') && process.platform === 'win32') {
    dialogText = `Please try installing Visual C++ 2019 redistributable from Microsoft website and try again.\nError details: ${e.stack}`;
  }
  // eslint-disable-next-line no-console
  console.error(dialogText);
  Sentry.captureException(e);
  if (isFromElectron) {
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
  });
};

process.on('uncaughtException', (e) => {
  fatalErrorHandler(e);
});

process.on('unhandledRejection', (e) => {
  fatalErrorHandler(e as any);
});
