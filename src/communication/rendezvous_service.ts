import superagent from 'superagent';
import debug from 'debug';
import { InitiatorMessage } from './initiators/initiator';
import { getPeersManager } from './get_peers_manager';
import { RENDEZVOUS_SERVICE_URL, RENDEZVOUS_SERVICE_REGISTER_INTERVAL } from '../utils/constants';
import { getInternalIps } from '../utils/ip';

const log = debug('soundsync:rendezvous');

const rendezvousApi = superagent.agent().use((req) => {
  if (req.trustLocalhost) {
    // used for local dev of the rendezvous service, we should test for the existance of the method
    // because it is not exposed when running in a web browser context
    req.trustLocalhost();
  }
});

const registerToRendezvousService = async (port: number) => {
  const ips = getInternalIps().map((ip) => `${ip}:${port}`).join(',');
  log(`Registering to rendezvous service with: ${ips}`);
  try {
    await rendezvousApi
      .post(`${RENDEZVOUS_SERVICE_URL}/api/ip_registry/register`)
      .set('Content-Type', 'text/plain')
      .type('text')
      .send(ips);
  } catch (e) {
    log('Error while registering', e);
  }
};

export const enableRendezvousServiceRegister = (port: number) => {
  registerToRendezvousService(port);
  setInterval(() => {
    registerToRendezvousService(port);
  }, RENDEZVOUS_SERVICE_REGISTER_INTERVAL);
};

const getKnownRendezvousIps = async () => {
  const { body } = await rendezvousApi
    .get(`${RENDEZVOUS_SERVICE_URL}/api/ip_registry/peers`);
  return body;
};

export const enableRendezvousServicePeersDetection = async (shouldConnectWithRendezvous = false) => {
  const ips = await getKnownRendezvousIps();
  const peersManager = getPeersManager();
  ips.forEach((ip) => {
    if (shouldConnectWithRendezvous) {
      peersManager.joinPeerWithRendezvousApi(`http://${ip}`);
    } else {
      peersManager.joinPeerWithHttpApi(`http://${ip}`);
    }
  });
};

export const postRendezvousMessage = async (conversationUuid: string, message: any, isPrimary: boolean) => {
  // if we are primary, we send the message to the inbox of the secondary peer, denoted with _S
  await rendezvousApi
    .post(`${RENDEZVOUS_SERVICE_URL}/api/conversations/${conversationUuid}_${isPrimary ? 'S' : 'P'}/messages`)
    .type('text')
    .set('Content-Type', 'text/plain')
    .send(JSON.stringify(message));
};

export const fetchRendezvousMessages = async (conversationUuid: string, isPrimary: boolean) => {
  const { body } = await rendezvousApi
    .get(`${RENDEZVOUS_SERVICE_URL}/api/conversations/${conversationUuid}_${isPrimary ? 'P' : 'S'}/messages`);
  return body.map((message) => JSON.parse(message)) as InitiatorMessage[];
};

export const notifyPeerOfRendezvousMessage = async (conversationUuid: string, host: string) => {
  // this is only used from the webui when it is running in a https context and not able to make http fetch request
  // so we need a hack: loading a <img> with the source on the host, this will still be allowed in a secure context
  // and allow us to notify the peer on the local network
  if (typeof document === 'undefined') {
    throw new Error('This method is meant to be used in a web context, not in a NodeJS one');
  }
  const imgEl = document.createElement('img');
  await new Promise((resolve, reject) => {
    imgEl.onload = resolve;
    imgEl.onerror = reject;
    imgEl.src = `${host}/rendezvous_message_notify?conversionUuid=${conversationUuid}`;
  });
};
