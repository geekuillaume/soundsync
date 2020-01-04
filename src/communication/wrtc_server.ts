import { EventEmitter } from 'events';
import _ from 'lodash';
import superagent from 'superagent';
import uuidv4 from 'uuid/v4';
import debug from 'debug';

import { SoundSyncHttpServer } from './http_server';
import { WebrtcPeer } from './wrtc_peer';
import { ControllerMessage } from './messages';

const log = debug('soundsync:wrtc');

export class WebrtcServer extends EventEmitter {
  peers: {[uuid: string]: WebrtcPeer} = {};
  coordinatorPeer: WebrtcPeer;

  constructor() {
    super();
    log(`Creating new Webrtc server`);
  }

  attachToSignalingServer(httpServer: SoundSyncHttpServer) {
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
    const uuid = uuidv4();
    const name = 'test';  // TODO change with own name
    const peer = new WebrtcPeer({ name, uuid });

    peer.on('controllerMessage', (message: ControllerMessage) => {
      this.emit('controllerMessage', { peer, message });
    })

    this.peers[uuid] = peer;
    this.coordinatorPeer = peer;

    const offer = await peer.connection.createOffer();
    await peer.connection.setLocalDescription(offer);

    const {body: {sdp}} = await superagent.post(`${host}/connect_webrtc_peer`)
      .send({
        name,
        uuid: uuid,
        sdp: peer.connection.localDescription,
      });
    peer.log(`Got response from other peer http server`);
    await peer.connection.setRemoteDescription(sdp);
    await new Promise((resolve) => {
      peer.once('connected', resolve);
    });
    peer.log(`Accepted sdp answer`);
  }

  async broadcast(message: ControllerMessage, ignorePeerByUuid: string[] = []) {
    await Promise.all(_.map(this.peers, (peer) => {
      if (ignorePeerByUuid.includes(peer.uuid)) {
        return;
      }
      return peer.sendControllerMessage(message);
    }));
  }
}
