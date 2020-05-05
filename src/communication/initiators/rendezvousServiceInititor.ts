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
    } catch (e) {}
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
    const messages = await fetchRendezvousMessages(initiatorUuid, false);

    if (!initiatorsListener[initiatorUuid]) {
      const {
        senderUuid, senderInstanceUuid, senderVersion,
      } = messages[0];
      ctx.assert(!!senderUuid && !!senderInstanceUuid && !!senderVersion, 400, 'senderUuid, senderInstanceUuid and senderVersion should be set');
      if (senderVersion !== SOUNDSYNC_VERSION) {
        ctx.throw(`Different version of Soundsync, please check each client is on the same version.\nOwn version: ${SOUNDSYNC_VERSION}\nOther peer version: ${senderVersion}`, 400);
      }

      const existingPeer = getPeersManager().peers[senderUuid];
      if (existingPeer) {
        if (existingPeer.instanceUuid === senderInstanceUuid) {
          ctx.throw(409, 'peer with same uuid and instanceUuid already exist');
        }
        // existingPeer.delete(true, 'new peer with same uuid but different instanceUuid connecting');
        // TODO: add reason to delete method
        existingPeer.delete();
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const peer = new WebrtcPeer({
        uuid: senderUuid,
        name: `placeholderForRendezvousJoin_${ctx.request.ip}`,
        host: ctx.request.ip,
        instanceUuid: senderInstanceUuid,
        initiatorConstructor: createRendezvousServiceInitiator(ctx.request.ip, initiatorUuid, false), // we are not primary because we didn't sent the first request
      });
    }

    await Promise.all(messages.map(initiatorsListener[initiatorUuid]));

    ctx.body = EMPTY_IMAGE;
    ctx.set('Content-type', 'image/png');
    ctx.status = 200;
  });
};
