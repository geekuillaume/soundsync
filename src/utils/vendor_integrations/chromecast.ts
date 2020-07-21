import bonjour from 'bonjour';
import _ from 'lodash';
import util from 'util';
import { Application, Client } from 'castv2-client';

import { delay } from '../misc';
import { CHROMECAST_APPID } from '../constants';

const CHROMECAST_DETECTION_TIMEOUT = 5 * 1000; // 5 seconds

interface ChromecastInfo {
  host: string;
  name: string;
}

let detector: bonjour.Browser;
const detectedChromecast: ChromecastInfo[] = [];

export const startChromecastDetection = _.memoize(async () => {
  detector = bonjour().find({
    type: 'googlecast',
  });
  detector.on('down', (service) => {
    // @ts-ignore
    const host = service.addresses[0];
    _.remove(detectedChromecast, (chromecast) => chromecast.host === host);
  });
  await Promise.race([
    delay(CHROMECAST_DETECTION_TIMEOUT),
    new Promise((resolve) => {
      let hasAlreadyBeenResolved = false;
      // this is used to wait for 500 ms after detecting first chromecast before returning
      // as most of the time, all chromecast are detected quickly just after the first is being found
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
        const host = service.addresses[0];
        if (!detectedChromecast.some((chromecast) => chromecast.host === host)) {
          detectedChromecast.push({
            // @ts-ignore
            host,
            // @ts-ignore
            name: service.txt.fn,
          });
        }
        resolveDebounce();
      });
    }),
  ]);
});

export const getDetectedChromecasts = () => detectedChromecast;

// function SoundsyncChromecastController(client, sourceId, destinationId) {
//   RequestResponseController.call(this, client, sourceId, destinationId, CHROMECAST_MESSAGE_NAMESPACE);
// }
// util.inherits(SoundsyncChromecastController, RequestResponseController);
function SoundsyncChromecastApplication(...args) {
  Application.call(this, ...args);
  //@ts-ignore
  // this.soundsyncController = this.createController(SoundsyncChromecastController);
}
SoundsyncChromecastApplication.APP_ID = CHROMECAST_APPID;
util.inherits(SoundsyncChromecastApplication, Application);


export const startSoundsyncOnChromecast = async (host: string) => {
  const client = new Client();
  await new Promise((resolve, reject) => {
    client.connect(host, resolve);
    client.on('error', reject);
  });
  const controller = await new Promise((resolve, reject) => {
    client.launch(SoundsyncChromecastApplication, (err, ctrl) => {
      if (err) {
        reject(err);
      } else {
        resolve(ctrl);
      }
    });
  });
  return controller as any;
};
