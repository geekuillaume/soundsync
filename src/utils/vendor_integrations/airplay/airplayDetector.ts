import bonjour from 'bonjour';
import _ from 'lodash';

import { delay } from '../../misc';

const AIRPLAY_SPEAKER_DETECTION_TIMEOUT = 5 * 1000; // 5 seconds

interface AirplaySpeakerInfo {
  host: string;
  name: string;
  port: number;
}

let detector: bonjour.Browser;
const detectedAirplaySpeaker: AirplaySpeakerInfo[] = [];

export const startAirplaySpeakerDetection = _.memoize(async () => {
  detector = bonjour().find({
    type: 'raop',
  });
  detector.on('down', (service) => {
    // @ts-ignore
    const host = service.addresses[0];
    _.remove(detectedAirplaySpeaker, (chromecast) => chromecast.host === host);
  });
  await Promise.race([
    delay(AIRPLAY_SPEAKER_DETECTION_TIMEOUT),
    new Promise((resolve) => {
      let hasAlreadyBeenResolved = false;
      // this is used to wait for 500 ms after detecting first airplay speaker before returning
      // as most of the time, all airplay speaker are detected quickly just after the first is being found
      const resolveDebounce = () => {
        setTimeout(() => {
          if (hasAlreadyBeenResolved) {
            return;
          }
          hasAlreadyBeenResolved = true;
          resolve();
        }, 500);
      };

      detector.on('up', (service) => {
        // @ts-ignore
        const host = service.addresses.filter((addr) => !addr.includes(':'))[0];
        if (!detectedAirplaySpeaker.some((airplaySpeaker) => airplaySpeaker.host === host)) {
          detectedAirplaySpeaker.push({
            // @ts-ignore
            host: service.addresses.filter((addr) => !addr.includes(':'))[0],
            name: service.name,
            port: service.port,
          });
        }
        resolveDebounce();
      });
    }),
  ]);
});

export const getDetectedAirplaySpeakers = () => detectedAirplaySpeaker;
