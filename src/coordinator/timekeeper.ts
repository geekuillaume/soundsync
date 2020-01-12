import {performance} from 'perf_hooks';
import debug from 'debug';
import { WebrtcServer } from '../communication/wrtc_server';
import { WebrtcPeer } from '../communication/wrtc_peer';
import { TimekeepRequest, TimekeepResponse } from '../communication/messages';
import { TIMEKEEPER_REFRESH_INTERVAL } from '../utils/constants';

const log = debug(`soundsync:timekeeper`);

let deltaWithCoordinator = 0;

export const getCurrentSynchronizedTime = () => {
  return performance.now() + deltaWithCoordinator;
}

export const attachTimekeeperCoordinator = (server: WebrtcServer) => {
  server.on('peerControllerMessage:timekeepRequest', ({peer, message}: {peer: WebrtcPeer, message: TimekeepRequest}) => {
    log(`Received request from ${peer.uuid}`);
    peer.sendControllerMessage({
      type: 'timekeepResponse',
      sentAt: message.sentAt,
      respondedAt: performance.now(),
    });
  });
}

export const attachTimekeeperClient = (server: WebrtcServer) => {
  server.coordinatorPeer.on('controllerMessage:timekeepResponse', ({message}: {message: TimekeepResponse}) => {
    const receivedAt = performance.now();
    const roundtripTime = receivedAt - message.sentAt;
    const receivedByCoordinatorAt = message.sentAt + (roundtripTime / 2);
    const delta = message.respondedAt - receivedByCoordinatorAt;
    deltaWithCoordinator = delta;
    log(`Received response from coordinator, setting delta to ${delta}`);
  });

  const sendTimekeepRequest = () => {
    log(`Sending request to coordinator`);
    server.coordinatorPeer.sendControllerMessage({
      type: 'timekeepRequest',
      sentAt: performance.now(),
    });
  };

  setInterval(sendTimekeepRequest, TIMEKEEPER_REFRESH_INTERVAL);
  sendTimekeepRequest();
}
