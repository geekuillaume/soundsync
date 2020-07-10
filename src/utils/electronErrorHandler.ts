import electron from 'electron';
import open from 'open';
import { Sentry } from './sentry';

const isFromElectron = !!electron.app;

export const fatalErrorHandler = (e: Error) => {
  // eslint-disable-next-line no-console
  console.error(e);
  Sentry.captureException(e);
  if (isFromElectron) {
    if (electron.app.isReady()) {
      const buttonIndex = electron.dialog.showMessageBoxSync({
        type: 'error',
        message: `There has been an error with Soundsync`,
        detail: e.stack,
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
      electron.dialog.showErrorBox(`There has been an error with Soundsync`, e.stack);
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
