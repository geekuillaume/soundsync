import { RTCPeerConnection } from 'wrtc';
import debug, { Debugger } from 'debug';
import { onExit } from '../utils/on_exit';
import {
  CONTROLLER_CHANNEL_ID, NO_RESPONSE_TIMEOUT, HEARTBEAT_INTERVAL, HEARTBEAT_JITTER, AUDIO_CHANNEL_OPTIONS,
} from '../utils/constants';
import { ControllerMessage } from './messages';
import { Peer } from './peer';
import { WebrtcServer } from './wrtc_server';
import { DataChannelStream } from '../utils/datachannel_stream';
import { now } from '../utils/time';

export class WebrtcPeer extends Peer {
  connection: RTCPeerConnection;
  controllerChannel: RTCDataChannel;
  log: Debugger;
  private heartbeatInterval;
  private datachannels: RTCDataChannel[] = [];
  private webrtcServer: WebrtcServer;
  connectHandler: (peer: WebrtcPeer) => Promise<void>;

  constructor({
    uuid, name, connectHandler, coordinator = false, webrtcServer, host,
  }) {
    super({
      uuid, name, coordinator, host,
    });
    this.connectHandler = connectHandler;
    this.webrtcServer = webrtcServer;

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
    this.log = debug(`soundsync:wrtcPeer:${uuid}`);
    this.log(`Created new peer`);
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

  setUuid = (uuid: string) => {
    this.uuid = uuid;
    this.log = debug(`soundsync:wrtcPeer:${uuid}`);
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
    this.initWebrtc();
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
    this.log.extend(message.type)('Received controller message', message);
    this.emit(`controllerMessage:all`, { peer: this, message });
    this.emit(`controllerMessage:${message.type}`, { peer: this, message });
    this.webrtcServer.emit(`peerControllerMessage:${message.type}`, { peer: this, message });
  }

  sendControllerMessage(message: ControllerMessage) {
    if (this.controllerChannel.readyState !== 'open') {
      this.log('WARNING: Tried to send a controller message when channel was not open');
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

  connect = async () => {
    if (this.controllerChannel.readyState === 'open') {
      return;
    }
    await this.connectHandler(this);
  }

  createAudioSourceChannel = async (sourceUuid: string) => {
    this.log(`Requesting channel for source ${sourceUuid}`);
    const channel = this.connection.createDataChannel(`audioSource:${sourceUuid}`, AUDIO_CHANNEL_OPTIONS);
    if (channel.readyState !== 'open') {
      await new Promise((resolve) => {
        channel.onopen = resolve;
      });
    }
    this.datachannels.push(channel);
    // TODO: check that this isn't a memory leak when closing the channel
    return new DataChannelStream(channel);
  }

  private handleRequestedAudioSourceChannel = async (e: RTCDataChannelEvent) => {
    const { channel } = e;
    const sourceUuid = channel.label.match(/^audioSource:(.*)$/)[1];
    this.log(`Received request for source ${sourceUuid}`);
    this.datachannels.push(channel);
    const message = {
      peer: this,
      sourceUuid,
      stream: new DataChannelStream(channel),
    };
    this.emit('newSourceChannel', message);
    this.webrtcServer.emit('newSourceChannel', message);
  }
}
