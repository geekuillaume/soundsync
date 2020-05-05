import { EventEmitter } from 'events';
import _ from 'lodash';
import debug from 'debug';

import { createHttpApiInitiator } from './initiators/httpApiInitiator';
import { createRendezvousServiceInitiator } from './initiators/rendezvousServiceInititor';
import { WebrtcPeer } from './wrtc_peer';
import {
  ControllerMessage,
  ControllerMessageHandler,
} from './messages';
import { Peer } from './peer';

const log = debug('soundsync:wrtc');

export class PeersManager extends EventEmitter {
  peers: {[uuid: string]: Peer} = {};

  constructor() {
    super();
    log(`Creating peer manager`);
    this.on('newConnectedPeer', (peer) => {
      peer.sendControllerMessage({
        type: 'peerDiscovery',
        peersUuid: _.map(_.filter(this.peers, (p) => p.state === 'connected'), (p) => p.uuid),
      });
    });
  }

  async joinPeerWithHttpApi(host: string, uuid?: string) {
    const peer = new WebrtcPeer({
      name: 'remote',
      uuid: uuid || `placeholderForHttpApiJoin_${host}`,
      host,
      instanceUuid: 'placeholder',
      initiatorConstructor: createHttpApiInitiator(`http://${host}`),
    });
    await peer.connect();
  }

  joinPeerWithRendezvousApi = async (host: string) => {
    const peer = new WebrtcPeer({
      name: 'remote',
      uuid: `placeholderForRendezvousJoin_${host}`,
      host,
      instanceUuid: 'placeholder',
      initiatorConstructor: createRendezvousServiceInitiator(host),
    });
    await peer.connect();
  }

  broadcastPeersDiscoveryInfo = () => {
    this.broadcast({
      type: 'peerDiscovery',
      peersUuid: _.map(_.filter(this.peers, (p) => p.state === 'connected'), (p) => p.uuid),
    });
  }

  async broadcast(message: ControllerMessage, ignorePeerByUuid: string[] = []) {
    const sendToPeer = (peer) => {
      if (ignorePeerByUuid.includes(peer.uuid)) {
        return Promise.resolve(false);
      }
      return peer.sendControllerMessage(message);
    };
    await Promise.all(_.map(this.peers, sendToPeer));
  }

  onControllerMessage: ControllerMessageHandler<this> = (type, handler) => this.on(`controllerMessage:${type}`, ({ message, peer }) => handler(message, peer))
}
