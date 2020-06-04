import superagent from 'superagent';
import debug from 'debug';
import { InitiatorMessage } from './initiators/initiator';
import { getPeersManager } from './get_peers_manager';
import { RENDEZVOUS_SERVICE_URL, RENDEZVOUS_SERVICE_REGISTER_INTERVAL, WILDCARD_DNS_DOMAIN_NAME } from '../utils/constants';
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
      peersManager.joinPeerWithRendezvousApi(ip);
    } else {
      peersManager.joinPeerWithHttpApi(ip);
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

export const notifyPeerOfRendezvousMessage = async (conversationUuid: string, host: string) => {
  if (typeof document === 'undefined') {
    const err = new Error('This method is meant to be used in a web context, not in a NodeJS one');
    // @ts-ignore
    err.shouldAbort = true;
    throw err;
  }
  const [ip, port] = host.split(':');
  const ipParts = ip.split('.');
  const domainName = `${conversationUuid.replace(/-/g, '_')}-${ipParts.join('-')}.${WILDCARD_DNS_DOMAIN_NAME}:${Number(port) + 1}`; // the https port is the http port + 1
  const start = new Date().getTime();
  console.log(`==== start SNI request for ${conversationUuid}`);
  try {
    await superagent.get(`https://${domainName}`);
  } catch (e) {
    // this will always throw an error but it is expected as we only need this to advertise the conversationUuid to the peer
    // but the peer doesn't have a valid SSL certificate for this domain
  }
  console.log(`======= SNI request took: ${new Date().getTime() - start} ms`);
};
