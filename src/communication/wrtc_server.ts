import { EventEmitter } from 'events';
import _ from 'lodash';
import superagent from 'superagent';
import debug from 'debug';

import { SOUNDSYNC_VERSION } from '../utils/constants';
import { SoundSyncHttpServer } from './http_server';
import { WebrtcPeer } from './wrtc_peer';
import { getLocalPeer } from './local_peer';
import { ControllerMessage } from './messages';
import { Peer } from './peer';
import { waitUntilIceGatheringStateComplete } from '../utils/wait_for_ice_complete';
import { once } from '../utils/misc';

const log = debug('soundsync:wrtc');
let webrtcServer: WebrtcServer;

export class WebrtcServer extends EventEmitter {
  peers: {[uuid: string]: Peer} = {};
  coordinatorPeer: Peer;

  constructor() {
    super();
    if (webrtcServer) {
      throw new Error('Cannot create multiple webrtc servers');
    }
    log(`Creating new Webrtc server with peer uuid ${getLocalPeer().uuid}`);
    this.peers[getLocalPeer().uuid] = getLocalPeer();
  }

  attachToSignalingServer(httpServer: SoundSyncHttpServer) {
    this.coordinatorPeer = getLocalPeer();
    this.coordinatorPeer.coordinator = true;
    this.coordinatorPeer.on('controllerMessage:all', ({ message }: {message: ControllerMessage}) => {
      this.emit(`peerControllerMessage:${message.type}`, { peer: getLocalPeer(), message });
    });

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
        webrtcServer: this,
        uuid,
        name,
        host: ctx.request.ip,
        connectHandler: async () => {
          // Todo: handle reconnection here
        },
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

  async connectToCoordinatorHost(host: string) {
    const coordinatorHost = host;

    const { name } = getLocalPeer();
    const peer = new WebrtcPeer({
      name: '',
      webrtcServer: this,
      uuid: 'placeholderForCoordinatorUuid',
      coordinator: true,
      host,
      connectHandler: async (p: WebrtcPeer) => {
        const offer = await p.connection.createOffer();
        await p.connection.setLocalDescription(offer);
        await waitUntilIceGatheringStateComplete(p.connection);

        const connect = async () => {
          try {
            const { body: { sdp, uuid, coordinatorName } } = await superagent.post(`${coordinatorHost}/connect_webrtc_peer`)
              .send({
                name,
                uuid: getLocalPeer().uuid,
                sdp: p.connection.localDescription,
                version: SOUNDSYNC_VERSION,
              });
            p.setUuid(uuid);
            p.name = coordinatorName;
            p.log(`Got response from other peer http server`);
            await p.connection.setRemoteDescription(sdp);
            await once(p, 'connected');
          } catch (e) {
            if (e.status) {
              console.error('Error while connecting to coordinator');
              console.error(e.response.text);
              process.exit(1);
            }
            console.error('Cannot connect to coordinator, retrying in 5 seconds');
            console.error(e);
            setTimeout(connect, 5000);
          }
        };
        return connect();
      },
    });

    this.coordinatorPeer = peer;
    await peer.connect();
    this.peers[peer.uuid] = peer;
  }

  async broadcast(message: ControllerMessage, ignorePeerByUuid: string[] = []) {
    const sendToPeer = (peer) => {
      if (ignorePeerByUuid.includes(peer.uuid)) {
        return Promise.resolve(false);
      }
      return peer.sendControllerMessage(message);
    };
    await Promise.all([
      ..._.map(this.peers, sendToPeer),
      sendToPeer(this.coordinatorPeer),
    ]);
  }

  getPeerByUuid = (uuid: string) => {
    if (!this.peers[uuid]) {
      this.peers[uuid] = new WebrtcPeer({
        uuid,
        webrtcServer: this,
        name: 'remote',
        host: 'unknown',
        connectHandler: async (peer: WebrtcPeer) => {
          const offer = await peer.connection.createOffer();
          await peer.connection.setLocalDescription(offer);
          await waitUntilIceGatheringStateComplete(peer.connection);
          this.coordinatorPeer.sendControllerMessage({
            type: 'peerConnectionInfo',
            peerUuid: peer.uuid,
            offer: peer.connection.localDescription,
          });
          await once(peer, 'connected');
        },
      });
    }
    return this.peers[uuid];
  }
}

export const getWebrtcServer = () => {
  if (!webrtcServer) {
    webrtcServer = new WebrtcServer();
  }
  return webrtcServer;
};

export const isCoordinator = () => getWebrtcServer().coordinatorPeer === getLocalPeer();
