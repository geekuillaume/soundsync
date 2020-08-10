import _ from 'lodash';
import { getConfigField } from '../../coordinator/config';
import { BUILD_VERSION } from '../version';
import { isBrowser } from '../environment/isBrowser';

export const AUDIO_SOURCE_EVENT_INTERVAL = 10 * 60 * 1000; // every 10 minutes of source audio, send an event to posthog
export const AUDIO_SINK_EVENT_INTERVAL = 10 * 60 * 1000; // every 10 minutes of sink audio, send an event to posthog

const POSTHOG_TOKEN = 'FYxoT1fEXnvGa6T-ynUJxnquK5ie-g_M78wNEyiOHw0';
const POSTHOG_HOST = 'https://posthog.apps.besson.co';

export const getClient = _.memoize(async () => {
  if (isBrowser) {
    const posthog = (await import('posthog-js')).default;
    posthog.init(POSTHOG_TOKEN, {
      api_host: POSTHOG_HOST,
      autocapture: false,
    });
    posthog.identify(getConfigField('uuid'));
    return posthog;
  }
  const Posthog = (await import('posthog-node')).default;
  const client = new Posthog(POSTHOG_TOKEN, {
    host: POSTHOG_HOST,
  });
  return client;
});


type EVENT_NAME = 'First run' |
  'Audio source 10 minutes' |
  'Audio sink 10 minutes';

export const captureEvent = async (eventName: EVENT_NAME, properties?: any) => {
  try {
    if (getConfigField('disableTelemetry') === true) {
      return;
    }
    if (process.env.DEV_MODE) {
      return;
    }
    const client = await getClient();
    if (isBrowser) {
      client.capture(eventName, properties);
    } else {
      client.capture({
        distinctId: getConfigField('uuid'),
        event: eventName,
        properties,
      });
    }
  } catch (e) {
    // never let Posthog crash anything, if this doesn't work, just do nothing
  }
};

export const trackInstall = () => {
  captureEvent('First run', {
    platform: process.platform,
    version: BUILD_VERSION,
  });
};
