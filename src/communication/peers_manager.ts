import { EventEmitter } from 'events';
import _ from 'lodash';
import debug from 'debug';

import { onExit } from '../utils/on_exit';
import { getLocalPeer } from './local_peer';
import { createHttpApiInitiator, HttpApiInitiator } from './initiators/httpApiInitiator';
import { createRendezvousServiceInitiator, RendezVousServiceInitiator } from './initiators/rendezvousServiceInititor';
import { WebrtcPeer } from './wrtc_peer';
import {
  ControllerMessage,
  ControllerMessageHandler,
} from './messages';
import { Peer } from './peer';
import { createPeerRelayServiceInitiator, PeerRelayInitiator } from './initiators/peerRelayInitiator';


const log = debug('soundsync:wrtc');

export class PeersManager extends EventEmitter {
  private peers: Peer[] = [];

  constructor() {
    super();
    log(`Creating peer manager`);
    this.on('newConnectedPeer', (peer) => {
      peer.sendControllerMessage({
        type: 'peerDiscovery',
        peersUuid: _.map(_.filter(this.peers, (p) => p.state === 'connected'), (p) => p.uuid),
      });
    });
    onExit(() => {
      this.peers.forEach((peer) => peer.destroy('exiting'));
    });
    // TODO: handle clearing this.peers when peer is destroyed
  }

  joinPeerWithHttpApi = async (httpEndpoint: string) => {
    if (_.some(this.peers, (p) => (
      p instanceof WebrtcPeer
        && p.initiator instanceof HttpApiInitiator
        && p.initiator.httpEndpoint === httpEndpoint
    ))) {
      return;
    }
    const peer = new WebrtcPeer({
      name: `placeholderForHttpApiJoin_${httpEndpoint}`,
      uuid: `placeholderForHttpApiJoin_${httpEndpoint}`,
      instanceUuid: 'placeholder',
      initiatorConstructor: createHttpApiInitiator(httpEndpoint),
    });
    this.peers.push(peer);
    await peer.connect();
  }

  joinPeerWithRendezvousApi = async (host: string) => {
    if (_.some(this.peers, (p) => (
      p instanceof WebrtcPeer
        && p.initiator instanceof RendezVousServiceInitiator
        && p.initiator.host === host
    ))) {
      return;
    }
    const peer = new WebrtcPeer({
      name: `placeholderForRendezvousJoin_${host}`,
      uuid: `placeholderForRendezvousJoin_${host}`,
      instanceUuid: 'placeholder',
      initiatorConstructor: createRendezvousServiceInitiator(host),
    });
    this.peers.push(peer);
    await peer.connect();
  }

  joinPeerWithPeerRelay = async (targetUuid: string) => {
    if (_.some(this.peers, (p) => (
      p instanceof WebrtcPeer
        && p.initiator instanceof PeerRelayInitiator
        && p.initiator.targetUuid === targetUuid
    ))) {
      return;
    }
    if (targetUuid === getLocalPeer().uuid) {
      return;
    }
    if (_.some(this.peers, (p) => p.state === 'connected' && p.uuid === targetUuid)) { // already connected
      return;
    }
    const peer = new WebrtcPeer({
      name: `placeholderForPeerRelay_${targetUuid}`,
      uuid: `placeholderForPeerRelay_${targetUuid}`,
      instanceUuid: 'placeholder',
      initiatorConstructor: createPeerRelayServiceInitiator(targetUuid),
    });
    this.peers.push(peer);
    await peer.connect();
  }

  registerPeer = (peer: Peer) => {
    this.peers.push(peer);
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

  getConnectedPeerByUuid = (uuid: string) => _.find(this.peers, (p) => p.uuid === uuid && p.state === 'connected');
  isConnectedToAtLeastOnePeer = () => _.some(this.peers, (p) => p !== getLocalPeer() && p.state === 'connected');
}
