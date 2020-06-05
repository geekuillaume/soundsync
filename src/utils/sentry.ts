import * as Sentry from '@sentry/electron';
import { BUILD_VERSION } from './version';

try {
  Sentry.init({
    dsn: 'https://01d9c8f4220e4107992cfc3599c2f8e1@o403236.ingest.sentry.io/5265532',
    release: `soundsync_desktop_${BUILD_VERSION}`,
  });
} catch (e) {
  // do nothing as it is caused by electron not being available
}
