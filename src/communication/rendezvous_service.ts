import superagent from 'superagent';
import debug from 'debug';
import { isBrowser } from '../utils/environment/isBrowser';
import { InitiatorMessage } from './initiators/initiator';
import { getPeersManager } from './get_peers_manager';
import {
  RENDEZVOUS_SERVICE_URL, RENDEZVOUS_SERVICE_REGISTER_INTERVAL, WILDCARD_DNS_DOMAIN_NAME,
} from '../utils/constants';
import { getInternalIps } from '../utils/network/ip';
import { getLocalPeer } from './local_peer';

const log = debug('soundsync:rendezvous');

const rendezvousApi = superagent.agent().use((req) => {
  if (req.trustLocalhost) {
    // used for local dev of the rendezvous service, we should test for the existance of the method
    // because it is not exposed when running in a web browser context
    req.trustLocalhost();
  }
});

const registerToRendezvousService = async (port: number) => {
  const localUuid = getLocalPeer().uuid;
  const ips = getInternalIps().map((ip) => `${ip}:${port}_${localUuid}`).join(',');
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

const getKnownRendezvousPeers = async () => {
  try {
    const { body } = await rendezvousApi
      .get(`${RENDEZVOUS_SERVICE_URL}/api/ip_registry/peers`);
    return (body as any[]).map((ip) => ({
      ip: ip.split('_')[0],
      peerUuid: ip.split('_')[1],
    }));
  } catch {
    // an error here means that the rendezvous service is not reachable because of the internet connection or a CORS error if not loading from soundsync.app
    // do nothing and treat it as an empty response
    return [];
  }
};

export const enableRendezvousServicePeersDetection = async (shouldConnectWithRendezvous = false) => {
  const rendezvousPeers = await getKnownRendezvousPeers();
  const peersManager = getPeersManager();
  rendezvousPeers.forEach((rendezvousPeer) => {
    if (shouldConnectWithRendezvous) {
      peersManager.joinPeerWithRendezvousApi(rendezvousPeer.ip, rendezvousPeer.peerUuid);
    } else {
      peersManager.joinPeerWithHttpApi(rendezvousPeer.ip);
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
  const messages = body.map((message) => JSON.parse(message));
  for (const message of messages) {
    if (message.error === true) {
      const error = new Error(message.message);
      // @ts-ignore
      error.status = message.status;
      throw error;
    }
  }
  return messages as InitiatorMessage[];
};

export const canNotifyPeerOfRendezvousMessage = () => isBrowser;

export const notifyPeerOfRendezvousMessage = async (conversationUuid: string, host: string, peerUuid: string) => {
  const [ip, port] = host.split(':');
  const ipParts = ip.split('.');
  const domainName = `${conversationUuid.replace(/-/g, '_')}-${ipParts.join('-')}.${WILDCARD_DNS_DOMAIN_NAME}:${Number(port) + 1}`; // the https port is the http port + 1
  try {
    await superagent.get(`https://${domainName}`);
  } catch (e) {
    // this will always throw an error but it is expected as we only need this to advertise the conversationUuid to the peer
    // but the peer doesn't have a valid SSL certificate for this domain
  }

  try {
    // Using mdns to advertise the conversionationUuid, we cannot detect if the device supports MDNS so we try anyway
    // we are limited in lenth so we remove the - from the uuids
    await superagent.get(`https://${conversationUuid.replace(/-/g, '')}${peerUuid.slice(1).replace(/-/g, '')}.local`);
  } catch (e) {
    // this will always throw an error but it is expected as we only need this to advertise the conversationUuid to the peer
    // but the peer doesn't have a valid SSL certificate for this domain
  }
};
