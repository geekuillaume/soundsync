import { RTCPeerConnection } from 'wrtc';
import freeice from 'freeice';

import { WebrtcInitiator, InitiatorMessage } from './initiators/initiator';
import { getLocalPeer } from './local_peer';
import { getPeersManager } from './get_peers_manager';
import { onExit } from '../utils/on_exit';
import {
  CONTROLLER_CHANNEL_ID, NO_RESPONSE_TIMEOUT, HEARTBEAT_INTERVAL, HEARTBEAT_JITTER, AUDIO_CHANNEL_OPTIONS,
} from '../utils/constants';
import { ControllerMessage } from './messages';
import { Peer } from './peer';
import { DataChannelStream } from '../utils/datachannel_stream';
import { now } from '../utils/time';
import { once } from '../utils/misc';

const CONNECTION_RETRY_DELAY = 1000 * 2;

interface WebrtcPeerConstructorParams {
  uuid: string;
  name: string;
  instanceUuid: string;
  initiatorConstructor: (handleReceiveMessage: (message: InitiatorMessage) => Promise<void>) => WebrtcInitiator;
}

export class WebrtcPeer extends Peer {
  private connection: RTCPeerConnection;
  private controllerChannel: RTCDataChannel;
  hasSentOffer = false;
  shouldIgnoreOffer = false;
  private heartbeatInterval;
  private datachannelsBySourceUuid: {[sourceUuid: string]: RTCDataChannel} = {};
  initiator: WebrtcInitiator;

  constructor({
    uuid, name, instanceUuid, initiatorConstructor,
  }: WebrtcPeerConstructorParams) {
    super({
      uuid, name, instanceUuid,
    });
    onExit(() => this.disconnect(true, 'exiting process'));
    this.initiator = initiatorConstructor(this.handleInitiatorMessage);
  }

  initWebrtcIfNeeded = () => {
    if (this.connection) {
      return;
    }

    this.connection = new RTCPeerConnection({
      iceServers: freeice(),
    });
    this.connection.addEventListener('icecandidate', async ({ candidate }) => {
      if (!candidate || this.state === 'deleted') {
        return;
      }
      try {
        await this.initiator.sendMessage({
          candidate,
        });
      } catch {}
    });
    // this.connection.addEventListener('error', (e) => {
    //   console.error('Error from webrtc connection', e);
    // });
    // this.connection.addEventListener('icecandidateerror', (e) => {
    //   console.error('Error from ice candidates', e);
    // });
    this.controllerChannel = this.connection.createDataChannel('controller', {
      negotiated: true,
      id: CONTROLLER_CHANNEL_ID,
    });
    this.connection.ondatachannel = this.handleRequestedAudioSourceChannel;

    this.controllerChannel.addEventListener('open', () => {
      this.initiator.stopPolling();
      this.heartbeatInterval = setInterval(this.sendHeartbeat, HEARTBEAT_INTERVAL + (Math.random() * HEARTBEAT_JITTER));
      this.missingPeerResponseTimeout = setTimeout(this.handleNoHeartbeat, NO_RESPONSE_TIMEOUT);
      this.sendControllerMessage({
        type: 'peerInfo',
        peer: getLocalPeer().toDescriptor(),
      });
    });

    this.controllerChannel.addEventListener('close', () => this.disconnect(false, 'controller channel is closed'));
    this.controllerChannel.addEventListener('message', (e) => {
      this.handleControllerMessage(JSON.parse(e.data));
    });
  }

  cleanWebrtcState = () => {
    if (!this.connection) {
      return;
    }
    this.log('Cleaning webrtc state');
    this.hasSentOffer = false;
    this.shouldIgnoreOffer = false;
    this.connection.close();
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

  handleInitiatorMessage = async (message: InitiatorMessage) => {
    if (this.state === 'deleted') {
      return;
    }
    try {
      const { senderUuid } = message;
      const { description, candidate } = message;

      if (description) {
        this.initWebrtcIfNeeded();
        const offerCollision = description.type === 'offer' && (this.hasSentOffer || this.connection.signalingState !== 'stable');
        this.shouldIgnoreOffer = offerCollision && getLocalPeer().uuid > senderUuid;
        if (this.shouldIgnoreOffer) {
          return;
        }
        if (offerCollision) {
          // Rolling back, this should be done automatically in a next version of wrtc lib
          this.cleanWebrtcState();
          this.initWebrtcIfNeeded();
        }
        this.log('Setting remote description');
        await this.connection.setRemoteDescription(description);
        if (description.type === 'offer') {
          // const localDescription: any = {
          //   type: this.connection.signalingState === 'stable'
          //   || this.connection.signalingState === 'have-local-offer'
          //   || this.connection.signalingState === 'have-remote-pranswer' ? 'offer' : 'answer',
          //   sdp: (await this.connection.createAnswer()).sdp,
          // };
          await this.connection.setLocalDescription(await this.connection.createAnswer());
          try {
            await this.initiator.sendMessage({
              description: this.connection.localDescription,
            });
          } catch {}
        }
      } else if (candidate) {
        if (!this.connection) {
          this.log('Received candidate but connection was not yet initialized, ignoring');
          return;
        }
        try {
          await this.connection.addIceCandidate(candidate);
        } catch (err) {
          // if (!this.shouldIgnoreOffer) {
          //   throw err; // Suppress ignored offer's candidates
          // }
        }
      }
    } catch (e) {
      this.log('Error while handling initiator message');
      console.error(e);
      this.destroy('Initiator message error');
    }
  }

  connect = async (isRetry = false) => {
    if (this.state === 'deleted' || this.state === 'connected') {
      return;
    }
    const localDescription = await this.initiateConnection();
    try {
      this.initiator.startPolling();
      await this.initiator.sendMessage({
        description: localDescription,
      });
    } catch (e) {
      if (!isRetry) {
        this.log(`Cannot connect to peer with initiator ${this.initiator.type}`, e.message);
      }
      if (e.shouldAbort) {
        this.destroy('Initiator hinted that it we should abort');
        return;
      }
      setTimeout(() => this.connect(true), CONNECTION_RETRY_DELAY);
    }
  }

  _destroy = () => {
    this.initiator.destroy();
    this.cleanWebrtcState();
    this.disconnect();
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
    setTimeout(this.connect, CONNECTION_RETRY_DELAY);
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
    this.datachannelsBySourceUuid[sourceUuid] = channel;
    if (channel.readyState !== 'open') {
      await new Promise((resolve) => {
        channel.onopen = resolve;
      });
    }
    // TODO: check that this isn't a memory leak when closing the channel
    return new DataChannelStream(channel);
  }

  closeAudioSourceChanel = (sourceUuid: string) => {
    if (!this.datachannelsBySourceUuid[sourceUuid]) {
      throw new Error('No channel for this source exist');
    }
    this.datachannelsBySourceUuid[sourceUuid].close();
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
