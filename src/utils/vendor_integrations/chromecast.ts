import bonjour from 'bonjour';
import _ from 'lodash';
import util from 'util';
import {
  Application, Client, RequestResponseController, HeartbeatController,
} from 'castv2-client';

import { getLocalPeer } from '../../communication/local_peer';
import { delay } from '../misc';
import { CHROMECAST_APPID, CHROMECAST_MESSAGE_NAMESPACE } from '../constants';
import { WebrtcPeer } from '../../communication/wrtc_peer';
import { createBasicInitiator } from '../../communication/initiators/basicInitiator';
import { getPeersManager } from '../../communication/get_peers_manager';

const CHROMECAST_DETECTION_TIMEOUT = 5 * 1000; // 5 seconds

interface ChromecastInfo {
  host: string;
  name: string;
  controller?: {
    soundsyncController: {
      request: (data: any) => any;
      on: (type: 'message', listener: (data: any) => any) => any;
    };
    once: any;
    heartbeatController: any;
  };
}

let detector: bonjour.Browser;
const detectedChromecast: ChromecastInfo[] = [];

export const startChromecastDetection = async () => {
  if (detector || detectedChromecast.length) {
    return;
  }
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
};

export const getDetectedChromecasts = () => detectedChromecast.map(({ name, host, controller }) => ({
  // we need to map the object to prevent the chromecast controller object from being sent
  name,
  host,
  isConnected: !!controller,
}));

function SoundsyncChromecastController(client, sourceId, destinationId) {
  RequestResponseController.call(this, client, sourceId, destinationId, CHROMECAST_MESSAGE_NAMESPACE);
}
util.inherits(SoundsyncChromecastController, RequestResponseController);
function SoundsyncChromecastApplication(...args) {
  Application.call(this, ...args);
  //@ts-ignore
  this.soundsyncController = this.createController(SoundsyncChromecastController);
  this.heartbeatController = this.createController(HeartbeatController);
}
SoundsyncChromecastApplication.APP_ID = CHROMECAST_APPID;
util.inherits(SoundsyncChromecastApplication, Application);

// When starting Soundsync on a Chromecast, we send a message with the APPID and use the newly open websocket from the Chromecast SDK
// to send the WebRTC initator messages so that it works even without the rendezvous service and is faster to start
export const startSoundsyncOnChromecast = async (host: string) => {
  const chromecast = detectedChromecast.find((cr) => cr.host === host) || {
    name: null,
    host,
  };
  if (chromecast.controller) {
    // chromecast is already started
    return;
  }

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

  chromecast.controller = controller as any;

  chromecast.controller.soundsyncController.request({
    type: 'soundsync_init',
    data: {
      peerName: chromecast.name,
      callerPeerUuid: getLocalPeer().uuid,
    },
  });

  const peer = new WebrtcPeer({
    name: chromecast.name,
    uuid: `chromecastPlaceholder_${host}`,
    instanceUuid: 'placeholder',
    initiatorConstructor: createBasicInitiator((message) => {
      chromecast.controller.soundsyncController.request({
        type: 'initiator_message',
        data: message,
      });
    }),
  });
  getPeersManager().registerPeer(peer);

  chromecast.controller.soundsyncController.on('message', (data) => {
    if (data.type === 'initiator_message') {
      peer.initiator.handleReceiveMessage(data.data);
    }
  });

  peer.connect();

  chromecast.controller.heartbeatController.start();
  chromecast.controller.heartbeatController.on('timeout', () => {
    chromecast.controller = undefined;
    peer.destroy('Chromecast timeout');
  });
  chromecast.controller.once('close', () => {
    chromecast.controller = undefined;
    peer.destroy('Chromecast close');
  });
};
