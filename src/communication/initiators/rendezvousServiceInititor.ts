import Router from 'koa-router';
import { getLocalPeer } from '../local_peer';
import { SOUNDSYNC_VERSION, EMPTY_IMAGE } from '../../utils/constants';
import { getPeersManager } from '../get_peers_manager';
import { WebrtcPeer } from '../wrtc_peer';
import { WebrtcInitiator, InitiatorMessage, InitiatorMessageContent } from './initiator';
import { fetchRendezvousMessages, postRendezvousMessage, notifyPeerOfRendezvousMessage } from '../rendezvous_service';

const POLLING_INTERVAL = 3000;
const initiatorsListener: {[initiatorUuid: string]: (message: InitiatorMessage) => unknown} = {};

export class RendezVousServiceInitiator extends WebrtcInitiator {
  uuid: string;
  type = 'rendezvous service';
  private pollingInterval;

  constructor(
    uuid: string,
    public handleReceiveMessage: (message: InitiatorMessage) => void,
    public host: string,
    public isPrimary?: boolean, // the primary is the peer which sent the first request
  ) {
    super(uuid, handleReceiveMessage);
    initiatorsListener[this.uuid] = this.handleReceiveMessage;
  }

  destroy = () => {
    this.stopPolling();
    delete initiatorsListener[this.uuid];
  }

  sendMessage = async (message: InitiatorMessageContent) => {
    await postRendezvousMessage(this.uuid, {
      senderUuid: getLocalPeer().uuid,
      senderInstanceUuid: getLocalPeer().instanceUuid,
      senderVersion: SOUNDSYNC_VERSION,
      ...message,
    } as InitiatorMessage, this.isPrimary);
    try {
      await notifyPeerOfRendezvousMessage(this.uuid, this.host);
      const messages = await fetchRendezvousMessages(this.uuid, this.isPrimary);
      messages.forEach(this.handleReceiveMessage);
    } catch (e) {
      if (e.status === 409) {
        e.shouldAbort = true;
      }
      throw e;
    }
  }

  startPolling = () => {
    if (this.pollingInterval) {
      return;
    }
    this.pollingInterval = setInterval(this.poll, POLLING_INTERVAL);
  }

  stopPolling = () => {
    if (!this.pollingInterval) {
      return;
    }
    clearInterval(this.pollingInterval);
    delete this.pollingInterval;
  }

  poll = async () => {
    const messages = await fetchRendezvousMessages(this.uuid, this.isPrimary);
    messages.forEach(this.handleReceiveMessage);
  }
}

export const createRendezvousServiceInitiator = (host: string, uuid?: string, isPrimary = true) => (
  (handleReceiveMessage: (message: InitiatorMessage) => void) => (
    new RendezVousServiceInitiator(uuid, handleReceiveMessage, host, isPrimary)
  ));

export const initHttpServerRoutes = (router: Router) => {
  router.get('/rendezvous_message_notify', async (ctx) => {
    const { initiatorUuid } = ctx.request.query;
    ctx.assert(!!initiatorUuid, 400, 'initiatorUuid query string required');
    const messages = await fetchRendezvousMessages(initiatorUuid, false);
    ctx.assert(messages.length, 404, 'No messages');

    try {
      ctx.assert(messages[0].senderUuid !== getLocalPeer().uuid, 409, 'Connecting to own peer');

      if (!initiatorsListener[initiatorUuid]) {
        const {
          senderUuid, senderInstanceUuid, senderVersion,
        } = messages[0];
        ctx.assert(!!senderUuid && !!senderInstanceUuid && !!senderVersion, 400, 'senderUuid, senderInstanceUuid and senderVersion should be set');
        ctx.assert(senderVersion === SOUNDSYNC_VERSION, 400, `Different version of Soundsync, please check each client is on the same version.\nOwn version: ${SOUNDSYNC_VERSION}\nOther peer version: ${senderVersion}`);

        const peer = new WebrtcPeer({
          uuid: `placeholderForRendezvousInitiatorRequest_${initiatorUuid}`,
          name: `placeholderForRendezvousInitiatorRequest_${initiatorUuid}`,
          instanceUuid: senderInstanceUuid,
          initiatorConstructor: createRendezvousServiceInitiator(ctx.request.ip, initiatorUuid, false), // we are not primary because we didn't sent the first request
        });
        getPeersManager().registerPeer(peer);
      }

      await Promise.all(messages.map(initiatorsListener[initiatorUuid]));
    } catch (e) {
      await postRendezvousMessage(initiatorUuid, {
        error: true,
        message: e.message,
        status: e.status,
      }, false);
    }

    ctx.body = EMPTY_IMAGE;
    ctx.set('Content-type', 'image/png');
    ctx.status = 200;
  });
};
