import { RTCPeerConnection } from 'wrtc';
import freeice from 'freeice';

import { Sentry } from '../utils/vendor_integrations/sentry';
import { WebrtcInitiator, InitiatorMessage } from './initiators/initiator';
import { getLocalPeer } from './local_peer';
import { getPeersManager } from './get_peers_manager';
import {
  CONTROLLER_CHANNEL_ID, AUDIO_CHANNEL_OPTIONS, TIMEKEEP_CHANNEL_ID,
} from '../utils/constants';
import { ControllerMessage } from './messages';
import { Peer, Capacity } from './peer';
import { DataChannelStream } from '../utils/network/datachannel_stream';
import { once } from '../utils/misc';
import { getConfigField } from '../coordinator/config';

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
  // we send timekeep request on another WebRTC channel which is UDP-like to prevent lags from TCP packet queue and resends, we do not care if some timekeep packets are lost
  private timekeepChannel: RTCDataChannel;
  hasSentOffer = false;
  shouldIgnoreOffer = false;
  private datachannelsBySourceUuid: {[sourceUuid: string]: RTCDataChannel} = {};
  initiator: WebrtcInitiator;

  constructor({
    uuid, name, instanceUuid, initiatorConstructor,
  }: WebrtcPeerConstructorParams, { onRemoteDisconnect = () => {} } = {}) {
    super({
      uuid, name, instanceUuid,
    }, { onRemoteDisconnect });
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
    this.timekeepChannel = this.connection.createDataChannel('timekeep', {
      negotiated: true,
      id: TIMEKEEP_CHANNEL_ID,
      ordered: false,
      maxRetransmits: 0,
    });
    this.connection.ondatachannel = this.handleRequestedAudioSourceChannel;

    this.controllerChannel.addEventListener('open', () => {
      this.initiator.stopPolling();
      this.sendControllerMessage({
        type: 'peerInfo',
        peer: getLocalPeer().toDescriptor(),
        sharedState: getLocalPeer().capacities.includes(Capacity.SharedStateKeeper) ? getConfigField('sharedState') : undefined,
      });
    });

    this.controllerChannel.addEventListener('close', () => this.destroy('controller channel is closed', { canTryReconnect: true, advertiseDestroy: true }));
    this.controllerChannel.addEventListener('message', (e) => {
      this.handleControllerMessage(JSON.parse(e.data));
    });
    this.timekeepChannel.addEventListener('message', (e) => {
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
    delete this.timekeepChannel;
    this.datachannelsBySourceUuid = {};
  }

  initiateConnection = async (): Promise<RTCSessionDescription> => {
    this.initWebrtcIfNeeded();
    if (this.hasSentOffer) {
      return null;
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
          this.log('Creating answer');
          const answer = await this.connection.createAnswer();
          this.log('Setting local description');
          await this.connection.setLocalDescription(answer);
          this.log('Sending answer');
          try {
            await this.initiator.sendMessage({
              description: this.connection.localDescription,
            });
          } catch (e) {
            this.log('Error while sending answer', e);
          }
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
      Sentry.captureException(e);
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
      if (localDescription) {
        await this.initiator.sendMessage({
          description: localDescription,
        });
      }
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
    // TODO: create new peer if necessary to handle auto reconnect
  }

  private handleControllerMessage = (message: ControllerMessage) => {
    if (message.type === 'disconnect') {
      this.destroy('received disconnect message from peer');
      return;
    }
    this._onReceivedMessage(message);
  }

  sendControllerMessage(message: ControllerMessage) {
    const channel = ['timekeepRequest', 'timekeepResponse'].includes(message.type) ? this.timekeepChannel : this.controllerChannel;
    if (!channel || channel.readyState !== 'open') {
      return Promise.resolve(false);
    }
    if (!this.logPerMessageType[message.type]) {
      this.logPerMessageType[message.type] = this.log.extend(message.type);
    }
    this.logPerMessageType[message.type]('Sending controller message', message);
    return channel.send(JSON.stringify(message));
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
      this.log(`Trying to close already closed channel`);
      return;
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
