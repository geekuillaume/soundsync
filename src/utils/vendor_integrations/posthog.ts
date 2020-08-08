import PostHog from 'posthog-node';
import { getConfigField } from '../../coordinator/config';

export const AUDIO_SOURCE_EVENT_INTERVAL = 10 * 60 * 1000; // every 10 minutes of source audio, send an event to posthog
export const AUDIO_SINK_EVENT_INTERVAL = 10 * 60 * 1000; // every 10 minutes of sink audio, send an event to posthog

const client = new PostHog(
  'FYxoT1fEXnvGa6T-ynUJxnquK5ie-g_M78wNEyiOHw0',
  { host: 'https://posthog.apps.besson.co' },
);

type EVENT_NAME = 'First run' |
  'Audio source 10 minutes' |
  'Audio sink 10 minutes';

export const captureEvent = (eventName: EVENT_NAME, properties?: any) => {
  if (getConfigField('disableTelemetry') === true) {
    return;
  }
  client.capture({
    distinctId: getConfigField('uuid'),
    event: eventName,
    properties,
  });
};
