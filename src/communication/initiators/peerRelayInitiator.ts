import { v4 as uuidv4 } from 'uuid';
import { getLocalPeer } from '../local_peer';
import { SOUNDSYNC_VERSION } from '../../utils/constants';
import { getPeersManager } from '../get_peers_manager';
import { WebrtcPeer } from '../wrtc_peer';
import { WebrtcInitiator, InitiatorMessage, InitiatorMessageContent } from './initiator';
import { PeerConnectionInfoMessage } from '../messages';

const initiatorsListener: {[initiatorUuid: string]: (message: PeerConnectionInfoMessage) => unknown} = {};

export class PeerRelayInitiator extends WebrtcInitiator {
  type = 'peer relay';
  private receivedMessagesUuid: string[] = [];

  constructor(
    uuid: string,
    public handleReceiveMessage: (message: InitiatorMessage) => void,
    public targetUuid: string,
  ) {
    super(uuid, handleReceiveMessage);
    initiatorsListener[this.uuid] = (message: PeerConnectionInfoMessage) => {
      if (this.receivedMessagesUuid.includes(message.messageUuid)) {
        return;
      }
      this.receivedMessagesUuid.push(message.messageUuid);
      this.handleReceiveMessage(message);
    };
  }

  sendMessage = async (message: InitiatorMessageContent) => {
    getPeersManager().broadcast({
      type: 'peerConnectionInfo',
      messageUuid: uuidv4(),
      targetUuid: this.targetUuid,
      senderVersion: SOUNDSYNC_VERSION,
      senderUuid: getLocalPeer().uuid,
      senderInstanceUuid: getLocalPeer().instanceUuid,
      initiatorUuid: this.uuid,
      ...message,
    }, [getLocalPeer().uuid]);
  }
}

export const createPeerRelayServiceInitiator = (targetUuid: string, uuid?: string) => (
  (handleReceiveMessage: (message: InitiatorMessage) => void) => (
    new PeerRelayInitiator(uuid, handleReceiveMessage, targetUuid)
  ));

export const handlePeerRelayInitiatorMessage = async (message: PeerConnectionInfoMessage) => {
  const { initiatorUuid } = message;
  if (!initiatorsListener[initiatorUuid]) {
    const {
      senderUuid, senderInstanceUuid, senderVersion,
    } = message;
    if (senderVersion !== SOUNDSYNC_VERSION) {
      throw new Error(`Different version of Soundsync, please check each client is on the same version.\nOwn version: ${SOUNDSYNC_VERSION}\nOther peer version: ${senderVersion}`);
    }

    const existingPeer = getPeersManager().peers[senderUuid];
    if (existingPeer) {
      if (existingPeer.instanceUuid === senderInstanceUuid) {
        throw new Error('peer with same uuid and instanceUuid already exist');
      }
      // existingPeer.delete(true, 'new peer with same uuid but different instanceUuid connecting');
      // TODO: add reason to delete method
      existingPeer.delete();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const peer = new WebrtcPeer({
      uuid: senderUuid,
      name: `placeholderForPeerRelayJoin_${senderUuid}`,
      host: 'unknown',
      instanceUuid: senderInstanceUuid,
      initiatorConstructor: createPeerRelayServiceInitiator(senderUuid, initiatorUuid),
    });
  }
  await initiatorsListener[initiatorUuid](message);
};
