import { EventEmitter } from 'events';
import _ from 'lodash';
import superagent from 'superagent';
import debug from 'debug';

import { SOUNDSYNC_VERSION } from '../utils/constants';
import { SoundSyncHttpServer } from './http_server';
import { WebrtcPeer } from './wrtc_peer';
import { getLocalPeer } from './local_peer';
import {
  ControllerMessage,
  LightMessage,
  SourcePatchMessage,
  SinkPatchMessage,
  PeerConnectionInfoMessage,
  TimekeepRequest,
  TimekeepResponse,
  PeerDiscoveryMessage,
  PeerSoundStateMessage,
} from './messages';
import { Peer } from './peer';
import { waitUntilIceGatheringStateComplete } from '../utils/wait_for_ice_complete';
import { once } from '../utils/misc';

const log = debug('soundsync:wrtc');
let peersManager: PeersManager;

export class PeersManager extends EventEmitter {
  peers: {[uuid: string]: Peer} = {};

  constructor() {
    super();
    if (peersManager) {
      throw new Error('Cannot create multiple peers managers');
    }
    log(`Creating peer manager with peer uuid ${getLocalPeer().uuid}`);
    this.peers[getLocalPeer().uuid] = getLocalPeer();
    this.on('newConnectedPeer', this.broadcastPeersDiscoveryInfo);
  }

  attachToSignalingServer(httpServer: SoundSyncHttpServer) {
    httpServer.router.post('/connect_webrtc_peer', async (ctx) => {
      const {
        name, uuid, sdp, version,
      } = ctx.request.body;
      if (version !== SOUNDSYNC_VERSION) {
        ctx.throw(`Different version of Soundsync, please the client or the coordinator.\nCoordinator version: ${SOUNDSYNC_VERSION}\nClient version: ${version}`, 400);
      }
      log(`Received new connection request from HTTP from peer ${name} with uuid ${uuid}`);
      const existingPeer = this.peers[uuid];
      if (existingPeer && existingPeer instanceof WebrtcPeer) {
        existingPeer.disconnect(true);
      }
      const peer = new WebrtcPeer({
        uuid,
        name,
        host: ctx.request.ip,
      });

      await peer.connection.setRemoteDescription(sdp);
      const answer = await peer.connection.createAnswer();

      peer.connection.setLocalDescription(answer);
      peer.log(`Responding with offer`);
      ctx.body = {
        status: 'ok',
        sdp: peer.connection.localDescription,
        uuid: getLocalPeer().uuid,
        coordinatorName: getLocalPeer().name,
      };
      this.peers[uuid] = peer;
      this.broadcastPeersDiscoveryInfo();
    });

    // httpServer.router.post('/ice_candidate', async (ctx) => {
    //   const { uuid, iceCandidates } = ctx.request.body;
    //   if (iceCandidates) {
    //     for (const iceCandidate of iceCandidates) {
    //       await this.peers[uuid].connection.addIceCandidate(iceCandidate);
    //     }
    //   }
    //   ctx.body = {
    //     status: 'ok',
    //     candidates: this.peers[uuid].candidates,
    //   };
    //   this.peers[uuid].candidates = [];
    // });
  }

  async joinPeerWithHttpApi(host: string) {
    const { name } = getLocalPeer();
    const peer = new WebrtcPeer({
      name: '',
      uuid: 'placeholderForCoordinatorUuid',
      host,
    });

    const offer = await peer.connection.createOffer();
    await peer.connection.setLocalDescription(offer);
    await waitUntilIceGatheringStateComplete(peer.connection);

    const connect = async () => {
      try {
        const { body: { sdp, uuid, coordinatorName } } = await superagent.post(`${host}/connect_webrtc_peer`)
          .send({
            name,
            uuid: getLocalPeer().uuid,
            sdp: peer.connection.localDescription,
            version: SOUNDSYNC_VERSION,
          });
        peer.setUuid(uuid);
        this.peers[uuid] = peer;
        peer.name = coordinatorName;
        peer.log(`Got response from other peer http server`);
        await peer.connection.setRemoteDescription(sdp);
        await once(peer, 'connected');
      } catch (e) {
        console.error('Cannot join peer, retrying in 5 seconds');
        console.error(e);
        setTimeout(connect, 5000);
      }
    };
    return connect();
  }

  broadcastPeersDiscoveryInfo = () => {
    this.broadcast({
      type: 'peerDiscovery',
      peersUuid: _.map(this.peers, (p) => p.uuid),
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

  getPeerByUuid = (uuid: string) => {
    if (!this.peers[uuid]) {
      const peer = new WebrtcPeer({
        uuid,
        name: 'remote',
        host: 'unknown',
      });
      peer.connectFromOtherPeers();
      this.peers[uuid] = peer;
    }
    return this.peers[uuid];
  }

  onControllerMessage(type: LightMessage['type'], handler: (message: LightMessage, peer: Peer) => any): this;
  onControllerMessage(type: SourcePatchMessage['type'], handler: (message: SourcePatchMessage, peer: Peer) => any): this;
  onControllerMessage(type: SinkPatchMessage['type'], handler: (message: SinkPatchMessage, peer: Peer) => any): this;
  onControllerMessage(type: PeerConnectionInfoMessage['type'], handler: (message: PeerConnectionInfoMessage, peer: Peer) => any): this;
  onControllerMessage(type: TimekeepRequest['type'], handler: (message: TimekeepRequest, peer: Peer) => any): this;
  onControllerMessage(type: TimekeepResponse['type'], handler: (message: TimekeepResponse, peer: Peer) => any): this;
  onControllerMessage(type: PeerSoundStateMessage['type'], handler: (message: PeerSoundStateMessage, peer: Peer) => any): this;
  onControllerMessage(type: TimekeepRequest['type'], handler: (message: TimekeepRequest, peer: Peer) => any): this;
  onControllerMessage(type: TimekeepResponse['type'], handler: (message: TimekeepResponse, peer: Peer) => any): this;
  onControllerMessage(type: PeerDiscoveryMessage['type'], handler: (message: PeerDiscoveryMessage, peer: Peer) => any): this;
  onControllerMessage(type, handler) {
    return this.on(`controllerMessage:${type}`, ({ message, peer }) => handler(message, peer));
  }
}

export const getPeersManager = () => {
  if (!peersManager) {
    peersManager = new PeersManager();
  }
  return peersManager;
};
