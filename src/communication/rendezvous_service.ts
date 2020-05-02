import superagent from 'superagent';
import debug from 'debug';
import { getPeersManager } from './peers_manager';
import { RENDEZVOUS_SERVICE_URL, RENDEZVOUS_SERVICE_REGISTER_INTERVAL } from '../utils/constants';
import { getInternalIps } from '../utils/ip';

const log = debug('soundsync:rendezvous');

const registerToRendezvousService = async (port: number) => {
  const ips = getInternalIps().map((ip) => `${ip}:${port}`).join(',');
  log(`Registering to rendezvous service with: ${ips}`);
  try {
    await superagent
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
  const { body } = await superagent
    .get(`${RENDEZVOUS_SERVICE_URL}/api/ip_registry/peers`);
  return body;
};

export const enableRendezvousServicePeersDetection = async () => {
  const ips = await getKnownRendezvousIps();
  const peersManager = getPeersManager();
  ips.forEach((ip) => peersManager.joinPeerWithHttpApi(ip));
};
