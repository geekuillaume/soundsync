import { RTCPeerConnection } from 'wrtc';
import uuidv4 from 'uuid/v4';
import superagent from 'superagent';

import { once } from '../utils/misc';
import { waitUntilIceGatheringStateComplete } from '../utils/wait_for_ice_complete';
import { getLocalPeer } from './local_peer';
import { getPeersManager } from './peers_manager';
import { onExit } from '../utils/on_exit';
import {
  CONTROLLER_CHANNEL_ID, NO_RESPONSE_TIMEOUT, HEARTBEAT_INTERVAL, HEARTBEAT_JITTER, AUDIO_CHANNEL_OPTIONS, SOUNDSYNC_VERSION,
} from '../utils/constants';
import { ControllerMessage } from './messages';
import { Peer } from './peer';
import { DataChannelStream } from '../utils/datachannel_stream';
import { now } from '../utils/time';

export class WebrtcPeer extends Peer {
  connection: RTCPeerConnection;
  controllerChannel: RTCDataChannel;
  private heartbeatInterval;
  private datachannelsBySourceUuid: {[sourceUuid: string]: RTCDataChannel} = {};

  constructor({
    uuid, name, host,
  }) {
    super({
      uuid, name, host,
    });
    // this.connection.onicecandidate = (e) => {
    //   if (e.candidate) {
    //     this.webrtcServer.coordinatorPeer.sendControllerMessage({
    //       type: 'peerConnectionInfo',
    //       peerUuid: this.uuid,
    //       iceCandidates: [e.candidate.candidate],
    //     })
    //   }
    // }

    this.initWebrtc();
  }

  initWebrtc = () => {
    if (this.connection) {
      this.connection.close();
    }
    delete this.connection;
    delete this.controllerChannel;

    this.connection = new RTCPeerConnection();
    this.controllerChannel = this.connection.createDataChannel('controller', {
      negotiated: true,
      id: CONTROLLER_CHANNEL_ID,
    });
    this.connection.ondatachannel = this.handleRequestedAudioSourceChannel;

    this.controllerChannel.addEventListener('open', () => {
      this.state = 'connected';
      this.log('Connected');
      this.emit('connected');
      this.heartbeatInterval = setInterval(this.sendHeartbeat, HEARTBEAT_INTERVAL + (Math.random() * HEARTBEAT_JITTER));
      this.missingPeerResponseTimeout = setTimeout(this.disconnect, NO_RESPONSE_TIMEOUT);
    });

    this.controllerChannel.addEventListener('close', () => this.disconnect());
    onExit(() => this.disconnect(true));
    this.controllerChannel.addEventListener('message', (e) => {
      this.handleControllerMessage(JSON.parse(e.data));
    });
  }

  connectFromOtherPeers = async () => {
    const offer = await this.connection.createOffer();
    await this.connection.setLocalDescription(offer);
    await waitUntilIceGatheringStateComplete(this.connection);
    getPeersManager().broadcast({
      type: 'peerConnectionInfo',
      peerUuid: this.uuid,
      requesterUuid: getLocalPeer().uuid,
      offer: this.connection.localDescription,
      isAnswer: false,
      uuid: uuidv4(),
    });
  }

  connectFromHttpApi = async (host: string) => {
    const offer = await this.connection.createOffer();
    await this.connection.setLocalDescription(offer);
    await waitUntilIceGatheringStateComplete(this.connection);

    const connect = async () => {
      try {
        const { body: { sdp, uuid, coordinatorName } } = await superagent.post(`${host}/connect_webrtc_peer`)
          .send({
            name: getLocalPeer().name,
            uuid: getLocalPeer().uuid,
            sdp: this.connection.localDescription,
            version: SOUNDSYNC_VERSION,
          });
        const existingPeer = getPeersManager().peers[uuid];
        if (existingPeer && existingPeer !== this && existingPeer.state === 'connected') {
          // we already connected to this peer, do nothing
          this.delete();
          return;
        }
        this.setUuid(uuid);
        this.name = coordinatorName;
        this.log(`Got response from other peer http server`);
        await this.connection.setRemoteDescription(sdp);
      } catch (e) {
        if (e.status === 409) {
          // we are already connected to this peer, bail out
          this.delete();
          return;
        }
        this.log('Cannot connect to peer with http api retrying in 10 seconds', e.message);
        setTimeout(connect, 10 * 1000);
      }
    };
    connect();
  }

  disconnect = async (advertiseDisconnect = false) => {
    if (this.state === 'disconnected') {
      return;
    }
    this.log('Connection closed');
    this.state = 'disconnected';
    this.emit('disconnected');

    if (advertiseDisconnect) {
      await this.sendControllerMessage({ type: 'disconnect' });
    }

    if (this.missingPeerResponseTimeout) {
      clearTimeout(this.missingPeerResponseTimeout);
      this.missingPeerResponseTimeout = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleControllerMessage = (message: ControllerMessage) => {
    if (message.type === 'ping' || message.type === 'pong') {
      this.handleReceivedHeartbeat(message.type === 'ping');
      return;
    }
    if (message.type === 'disconnect') {
      this.disconnect();
      return;
    }
    this._onReceivedMessage(message);
  }

  sendControllerMessage(message: ControllerMessage) {
    if (this.controllerChannel.readyState !== 'open') {
      return Promise.resolve(false);
    }
    if (message.type !== 'ping' && message.type !== 'pong') {
      this.log.extend(message.type)('Sending controller message', message);
    }
    return this.controllerChannel.send(JSON.stringify(message));
  }

  private missingPeerResponseTimeout;
  private lastHeartbeatReceivedTime;
  private handleReceivedHeartbeat(receivedPing = false) {
    this.lastHeartbeatReceivedTime = now();
    if (this.missingPeerResponseTimeout) {
      clearTimeout(this.missingPeerResponseTimeout);
      this.missingPeerResponseTimeout = null;
    }
    if (receivedPing) {
      this.sendControllerMessage({ type: 'pong' });
    }
    this.missingPeerResponseTimeout = setTimeout(this.disconnect, NO_RESPONSE_TIMEOUT);
  }

  private sendHeartbeat = () => {
    if (now() - this.lastHeartbeatReceivedTime < HEARTBEAT_INTERVAL) {
      return;
    }
    if (!this.missingPeerResponseTimeout) {
      this.missingPeerResponseTimeout = setTimeout(this.disconnect, NO_RESPONSE_TIMEOUT);
    }
    this.sendControllerMessage({ type: 'ping' });
  }

  createAudioSourceChannel = async (sourceUuid: string) => {
    if (this.datachannelsBySourceUuid[sourceUuid]) {
      throw new Error('A data channel already exist for this source, this sould not happen as it is managed by the audio source');
    }
    this.log(`Requesting channel for source ${sourceUuid}`);
    const channel = this.connection.createDataChannel(`audioSource:${sourceUuid}`, AUDIO_CHANNEL_OPTIONS);
    if (channel.readyState !== 'open') {
      await new Promise((resolve) => {
        channel.onopen = resolve;
      });
    }
    this.datachannelsBySourceUuid[sourceUuid] = channel;
    // TODO: check that this isn't a memory leak when closing the channel
    return new DataChannelStream(channel);
  }

  closeAudioSourceChanel = (sourceUuid: string) => {
    if (!this.datachannelsBySourceUuid[sourceUuid]) {
      throw new Error('No channel for this source exist');
    }
    const datachannel = this.datachannelsBySourceUuid[sourceUuid];
    datachannel.close();
    delete this.datachannelsBySourceUuid[sourceUuid];
  }

  private handleRequestedAudioSourceChannel = async (e: RTCDataChannelEvent) => {
    const { channel } = e;
    const sourceUuid = channel.label.match(/^audioSource:(.*)$/)[1];
    this.log(`Received request for source ${sourceUuid}`);
    const message = {
      peer: this,
      sourceUuid,
      stream: new DataChannelStream(channel),
    };
    this.emit('newSourceChannel', message);
    getPeersManager().emit('newSourceChannel', message);
  }
}
