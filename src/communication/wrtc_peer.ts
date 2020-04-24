import { RTCPeerConnection } from 'wrtc';
import superagent from 'superagent';

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
import { once } from '../utils/misc';

const HTTP_CONNECTION_RETRY_INTERVAL = 1000 * 2;

export class WebrtcPeer extends Peer {
  private connection: RTCPeerConnection;
  private controllerChannel: RTCDataChannel;
  hasSentOffer = false;
  shouldIgnoreOffer = false;
  private heartbeatInterval;
  private datachannelsBySourceUuid: {[sourceUuid: string]: RTCDataChannel} = {};

  constructor({
    uuid, name, host, instanceUuid,
  }) {
    super({
      uuid, name, host, instanceUuid,
    });
    onExit(() => this.disconnect(true, 'exiting process'));
  }

  initWebrtcIfNeeded = () => {
    if (this.connection) {
      return;
    }

    this.connection = new RTCPeerConnection({
      // iceServers: [
      //   { urls: 'stun:stun.l.google.com:19302' },
      // ],
    });
    this.controllerChannel = this.connection.createDataChannel('controller', {
      negotiated: true,
      id: CONTROLLER_CHANNEL_ID,
    });
    this.connection.ondatachannel = this.handleRequestedAudioSourceChannel;

    this.controllerChannel.addEventListener('open', () => {
      this.setState('connected');
      this.log('Connected');
      this.heartbeatInterval = setInterval(this.sendHeartbeat, HEARTBEAT_INTERVAL + (Math.random() * HEARTBEAT_JITTER));
      this.missingPeerResponseTimeout = setTimeout(this.handleNoHeartbeat, NO_RESPONSE_TIMEOUT);
    });

    this.controllerChannel.addEventListener('close', () => this.disconnect(false, 'controller channel is closed'));
    this.controllerChannel.addEventListener('message', (e) => {
      this.handleControllerMessage(JSON.parse(e.data));
    });
  }

  cleanWebrtcState = () => {
    this.hasSentOffer = false;
    this.shouldIgnoreOffer = false;
    if (this.connection) {
      this.connection.close();
    }
    delete this.connection;
    delete this.controllerChannel;
    if (this.missingPeerResponseTimeout) {
      clearTimeout(this.missingPeerResponseTimeout);
      delete this.missingPeerResponseTimeout;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      delete this.heartbeatInterval;
    }
  }

  initiateConnection = async (): Promise<RTCSessionDescription> => {
    this.initWebrtcIfNeeded();
    if (this.hasSentOffer) {
      return this.connection.localDescription;
    }
    await once(this.connection, 'negotiationneeded');
    this.hasSentOffer = true;
    await this.connection.setLocalDescription(await this.connection.createOffer());

    return this.connection.localDescription;
  }

  // will return response description if needed
  handlePeerConnectionMessage = async ({ description, candidate }: {description?: RTCSessionDescription; candidate?: RTCIceCandidate}) => {
    this.initWebrtcIfNeeded();
    if (description) {
      const offerCollision = description.type === 'offer' && (this.hasSentOffer || this.connection.signalingState !== 'stable');
      this.shouldIgnoreOffer = offerCollision && getLocalPeer().uuid > this.uuid;
      if (this.shouldIgnoreOffer) {
        return null;
      }
      if (offerCollision) {
        // Rolling back, this should be done automatically in a next version of wrtc lib
        this.cleanWebrtcState();
        this.initWebrtcIfNeeded();
      }
      await this.connection.setRemoteDescription(description);
      if (description.type === 'offer') {
        // const localDescription: any = {
        //   type: this.connection.signalingState === 'stable'
        //   || this.connection.signalingState === 'have-local-offer'
        //   || this.connection.signalingState === 'have-remote-pranswer' ? 'offer' : 'answer',
        //   sdp: (await this.connection.createAnswer()).sdp,
        // };
        await this.connection.setLocalDescription(await this.connection.createAnswer());
        return this.connection.localDescription;
      }
    } else if (candidate) {
      try {
        await this.connection.addIceCandidate(candidate);
      } catch (err) {
        if (!this.shouldIgnoreOffer) {
          throw err; // Suppress ignored offer's candidates
        }
      }
    }
  }

  connectFromOtherPeers = async () => {
    getPeersManager().broadcast({
      type: 'peerConnectionInfo',
      targetUuid: this.uuid,
      senderUuid: getLocalPeer().uuid,
      senderInstanceUuid: getLocalPeer().instanceUuid,
      description: await this.initiateConnection(),
    });
  }

  connectFromHttpApi = async (host: string) => {
    this.connect = async (isRetry = false) => {
      if (this.state === 'deleted' || this.state === 'connected') {
        return;
      }
      try {
        const localDescription = await this.initiateConnection();
        const {
          body: {
            description, uuid, name, instanceUuid,
          },
        } = await superagent.post(`${host}/connect_webrtc_peer`)
          .send({
            name: getLocalPeer().name,
            uuid: getLocalPeer().uuid,
            description: localDescription,
            version: SOUNDSYNC_VERSION,
            instanceUuid: getLocalPeer().instanceUuid,
          });
        const existingPeer = getPeersManager().peers[uuid];
        if (existingPeer && existingPeer !== this && existingPeer.state === 'connected') {
          if (existingPeer.state === 'connected') {
            // we already connected to this peer, do nothing
            this.delete();
            return;
          }
          existingPeer.delete();
        }
        this.setUuid(uuid);
        this.instanceUuid = instanceUuid;
        this.name = name;
        this.log(`Got response from other peer http server`);
        await this.handlePeerConnectionMessage({ description });
      } catch (e) {
        if (e.status === 409) {
          // we are already connected to this peer, bail out
          this.delete();
          return;
        }
        if (!isRetry) {
          this.log('Cannot connect to peer with http api retrying in 10 seconds', e.message);
        }
        setTimeout(() => this.connect(true), HTTP_CONNECTION_RETRY_INTERVAL);
      }
    };
    this.connect();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  connect = (isRetry?: boolean) => {
    // nothing to do by default if no connection method as been set
  }

  disconnect = async (advertiseDisconnect = false, cause = 'unknown') => {
    if (this.state === 'disconnected') {
      return;
    }
    this.log(`Connection closed, cause: ${cause}`);
    this.setState('disconnected');

    if (advertiseDisconnect) {
      await this.sendControllerMessage({ type: 'disconnect' });
    }

    this.cleanWebrtcState();
    // retry connection to this peer in 10 seconds
    setTimeout(this.connect, HTTP_CONNECTION_RETRY_INTERVAL);
  }

  private handleControllerMessage = (message: ControllerMessage) => {
    if (message.type === 'ping' || message.type === 'pong') {
      this.handleReceivedHeartbeat(message.type === 'ping');
      return;
    }
    if (message.type === 'disconnect') {
      this.disconnect(false, 'received disconnect message from peer');
      return;
    }
    this._onReceivedMessage(message);
  }

  private handleNoHeartbeat = () => {
    this.disconnect(false, 'no heartbeat received');
  }

  sendControllerMessage(message: ControllerMessage) {
    if (!this.controllerChannel || this.controllerChannel.readyState !== 'open') {
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
    this.missingPeerResponseTimeout = setTimeout(this.handleNoHeartbeat, NO_RESPONSE_TIMEOUT);
  }

  private sendHeartbeat = () => {
    if (now() - this.lastHeartbeatReceivedTime < HEARTBEAT_INTERVAL) {
      return;
    }
    if (!this.missingPeerResponseTimeout) {
      this.missingPeerResponseTimeout = setTimeout(this.handleNoHeartbeat, NO_RESPONSE_TIMEOUT);
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
