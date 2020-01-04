import { EventEmitter } from 'events';
import _ from 'lodash';
import superagent from 'superagent';
import debug from 'debug';

import { SoundSyncHttpServer } from './http_server';
import { WebrtcPeer } from './wrtc_peer';
import { localPeer } from './local_peer';
import { ControllerMessage } from './messages';
import { ownUuid } from '../utils/ownUuid';
import { Peer } from './peer';

const log = debug('soundsync:wrtc');

export class WebrtcServer extends EventEmitter {
  peers: {[uuid: string]: WebrtcPeer} = {};
  coordinatorPeer: Peer;

  constructor() {
    super();
    log(`Creating new Webrtc server with peer uuid ${ownUuid}`);
  }

  attachToSignalingServer(httpServer: SoundSyncHttpServer) {
    this.coordinatorPeer = localPeer;
    this.coordinatorPeer.on('controllerMessage', (message: ControllerMessage) => {
      this.emit('controllerMessage', { peer: localPeer, message });
    })

    httpServer.router.post('/connect_webrtc_peer', async (ctx) => {
      const { name, uuid, sdp } = ctx.request.body;
      log(`Received new connection request from HTTP from peer ${name} with uuid ${uuid}`);
      const peer = new WebrtcPeer({uuid, name});

      peer.on('controllerMessage', (message: ControllerMessage) => {
        this.emit('controllerMessage', { peer, message });
      })

      await peer.connection.setRemoteDescription(sdp);
      const answer = await peer.connection.createAnswer()
      peer.connection.setLocalDescription(answer);
      peer.log(`Responding with offer`);
      ctx.body = {
        status: 'ok',
        sdp: answer,
        uuid: ownUuid,
      }
      this.peers[uuid] = peer;
    });

    httpServer.router.post('/ice_candidate', async (ctx) => {
      const { uuid, iceCandidates } = ctx.request.body;
      if (iceCandidates) {
        for (const iceCandidate of iceCandidates) {
          await this.peers[uuid].connection.addIceCandidate(iceCandidate);
        }
      }
      ctx.body = {
        status: 'ok',
        candidates: this.peers[uuid].candidates,
      };
      this.peers[uuid].candidates = [];
    });
  }

  async connectToCoordinatorHost(host: string) {
    const name = 'test';  // TODO change with own name
    const peer = new WebrtcPeer({ name, uuid: 'placeholderForCoordinatorUuid' });

    peer.on('controllerMessage', (message: ControllerMessage) => {
      this.emit('controllerMessage', { peer, message });
    })

    this.coordinatorPeer = peer;

    const offer = await peer.connection.createOffer();
    await peer.connection.setLocalDescription(offer);

    const {body: {sdp, uuid}} = await superagent.post(`${host}/connect_webrtc_peer`)
      .send({
        name,
        uuid: ownUuid,
        sdp: peer.connection.localDescription,
      });

    this.peers[uuid] = peer;
    peer.setUuid(uuid);

    peer.log(`Got response from other peer http server`);
    await peer.connection.setRemoteDescription(sdp);
    await new Promise((resolve) => {
      peer.once('connected', resolve);
    });
    peer.log(`Accepted sdp answer`);
  }

  async broadcast(message: ControllerMessage, ignorePeerByUuid: string[] = []) {
    const sendToPeer = (peer) => {
      if (ignorePeerByUuid.includes(peer.uuid)) {
        return;
      }
      return peer.sendControllerMessage(message);
    }
    await Promise.all([
      ..._.map(this.peers, sendToPeer),
      sendToPeer(this.coordinatorPeer),
    ]);
  }
}
