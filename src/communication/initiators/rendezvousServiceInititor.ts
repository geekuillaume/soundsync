import Router from 'koa-router';
import debug from 'debug';
import { onSniRequest } from '../https_sni_request';
import { assert, addDashesToUuid } from '../../utils/misc';
import { getLocalPeer } from '../local_peer';
import { BUILD_VERSION } from '../../utils/version';
import { EMPTY_IMAGE } from '../../utils/constants';
import { getPeersManager } from '../get_peers_manager';
import { WebrtcPeer } from '../wrtc_peer';
import { WebrtcInitiator, InitiatorMessage, InitiatorMessageContent } from './initiator';
import { fetchRendezvousMessages, postRendezvousMessage, notifyPeerOfRendezvousMessage } from '../rendezvous_service';
import { Mdns } from '../../utils/network/mdns';

const POLLING_INTERVAL = 3000;
const initiatorsListener: {[initiatorUuid: string]: (message: InitiatorMessage) => Promise<void>} = {};

export class RendezVousServiceInitiator extends WebrtcInitiator {
  uuid: string;
  type = 'rendezvous service';
  private pollingInterval;

  constructor(
    uuid: string,
    public handleReceiveMessage: (message: InitiatorMessage) => Promise<void>,
    public host: string,
    public peerUuid?: string,
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
      senderVersion: BUILD_VERSION,
      ...message,
    } as InitiatorMessage, this.isPrimary);
    try {
      await notifyPeerOfRendezvousMessage(this.uuid, this.host, this.peerUuid);
      const fetchedMessages = await fetchRendezvousMessages(this.uuid, this.isPrimary);
      for (const fetchedMessage of fetchedMessages) {
        await this.handleReceiveMessage(fetchedMessage);
      }
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

export const createRendezvousServiceInitiator = (host: string, peerUuid?: string, uuid?: string, isPrimary = true) => (
  (handleReceiveMessage: (message: InitiatorMessage) => Promise<void>) => (
    new RendezVousServiceInitiator(uuid, handleReceiveMessage, host, peerUuid, isPrimary)
  ));

const handleRendezvousMessageNotification = async (initiatorUuid: string, host: string) => {
  assert(!!initiatorUuid, 'initiatorUuid query string required');
  const messages = await fetchRendezvousMessages(initiatorUuid, false);
  assert(messages.length, 'No messages');

  try {
    assert(messages[0].senderUuid !== getLocalPeer().uuid, 'Connecting to own peer');

    if (!initiatorsListener[initiatorUuid]) {
      const {
        senderUuid, senderInstanceUuid, senderVersion,
      } = messages[0];
      assert(!!senderUuid && !!senderInstanceUuid && !!senderVersion, 'senderUuid, senderInstanceUuid and senderVersion should be set');

      const peer = new WebrtcPeer({
        uuid: `placeholderForRendezvousInitiatorRequest_${initiatorUuid}`,
        name: `placeholderForRendezvousInitiatorRequest_${initiatorUuid}`,
        instanceUuid: senderInstanceUuid,
        initiatorConstructor: createRendezvousServiceInitiator(host, null, initiatorUuid, false), // we are not primary because we didn't sent the first request
      });
      getPeersManager().registerPeer(peer);
    }

    for (const message of messages) {
      await initiatorsListener[initiatorUuid](message);
      // this can happens as the handleInitiatorMessage method can throw an error that will destroy the peer instance
      assert(initiatorsListener[initiatorUuid], 'Error while handling initiator message');
    }
  } catch (e) {
    await postRendezvousMessage(initiatorUuid, {
      error: true,
      message: e.message,
      status: e.status,
    }, false);
  }
};

export const initHttpServerRoutes = (router: Router) => {
  router.get('/rendezvous_message_notify', async (ctx) => {
    const { initiatorUuid } = ctx.request.query;
    await handleRendezvousMessageNotification(initiatorUuid, ctx.request.ip);
    // this can happens as the handleInitiatorMessage method can throw an error that will destroy the peer instance
    ctx.assert(initiatorsListener[initiatorUuid], 500, 'Error while handling message');
    ctx.body = EMPTY_IMAGE;
    ctx.set('Content-type', 'image/png');
    ctx.status = 200;
  });

  onSniRequest(async (serverName: string) => {
    const initiatorUuid = serverName.split('-')[0].replace(/_/g, '-');
    try {
      await handleRendezvousMessageNotification(initiatorUuid, 'null');
    } catch (e) {
      // we don't have any way of advertising an error to the client as the SSL request will fail eitherway
      // so we just ignore it
    }
  });
};

const mdnsLog = debug(`soundsync:mdns`);
// We also use MDNS to notify the rendezvous service initiator to support networks with DNS servers which are blocking local ip DNS records
// and so the sslip.io domain names. Using this makes sure that the two devices are still on the same local network
export const initMdnsForRendezvousInitiator = () => {
  const mdns = new Mdns();
  const localPeerUuid = getLocalPeer().uuid;
  try {
    mdns.start();
  } catch (e) {
    mdnsLog('Error while binding mdns sockets', e);
  }
  mdns.on('packet', async (packetQuestion) => {
    // we need to use less than 64 chars for mdns domain name but we have two 32 chars uuids so we remove the first char from the local peer uuid
    // Format is [conversationUuid 32chars][last 31 chars of peerUuid 31chars].local
    const conversationUuid = addDashesToUuid(packetQuestion.substr(0, 32));
    const peerUuid = addDashesToUuid(`${localPeerUuid[0]}${packetQuestion.substr(32, 31)}`);
    if (peerUuid === localPeerUuid) {
      mdnsLog(`Received mdns request for ${packetQuestion}, handling initiator notification`);
      try {
        await handleRendezvousMessageNotification(conversationUuid, 'null');
      } catch (e) {
        // we don't have any way of advertising an error to the client as the SSL request will fail eitherway
        // so we just ignore it
      }
    }
  });
};
