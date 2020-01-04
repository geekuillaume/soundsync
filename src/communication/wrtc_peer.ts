import {performance} from 'perf_hooks';
import {RTCPeerConnection} from 'wrtc';
import debug, { Debugger } from 'debug';
import _ from 'lodash';
import { CONTROLLER_CHANNEL_ID, NO_RESPONSE_TIMEOUT, HEARTBEAT_INTERVAL, HEARTBEAT_JITTER } from '../utils/constants';
import { EventEmitter } from 'events';
import { ControllerMessage } from './messages';

export class WebrtcPeer extends EventEmitter {
  name: string;
  uuid: string;
  state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  connection: RTCPeerConnection;
  controllerChannel: RTCDataChannel;
  candidates = [];
  log: Debugger;
  heartbeatInterval;

  constructor({uuid, name}) {
    super();
    this.name = name;
    this.uuid = uuid;
    this.connection = new RTCPeerConnection();
    this.controllerChannel = this.connection.createDataChannel('controller', {
      negotiated: true,
      id: CONTROLLER_CHANNEL_ID,
      ordered: false,
      maxPacketLifeTime: 10,
    });

    this.connection.onicecandidate = (e) => {
      if (e.candidate) {
        this.log(`New ICE candidate`);
        this.candidates.push(e.candidate);
      }
    }

    this.controllerChannel.addEventListener('open', () => {
      this.state = 'connected';
      this.log('Connected');
      this.emit('connected');
    });

    this.controllerChannel.addEventListener('close', this.handleDisconnect);
    this.controllerChannel.addEventListener('message', (e) => {
      this.handleControllerMessage(JSON.parse(e.data));
    })

    this.log = debug(`soundsync:wrtcPeer:${uuid}`);
    this.log(`Created new peer`);

    this.heartbeatInterval = setInterval(this.sendHeartbeat, HEARTBEAT_INTERVAL + (Math.random() * HEARTBEAT_JITTER));
  }

  private handleDisconnect = () => {
    this.state = 'disconnected';
    this.log('Connection closed');
    this.emit('disconnected');
  }

  private handleControllerMessage = (message: ControllerMessage) => {
    if (message.type === 'ping' || message.type === 'pong') {
      this.handleReceivedHeartbeat(message.type === 'ping');
      return;
    }
    this.log('Received controller message', message);
    this.emit('controllerMessage', message);
  }

  sendControllerMessage(message: ControllerMessage) {
    if (this.controllerChannel.readyState !== 'open') {
      this.log('WARNING: Tried to send a controller message when channel was not open');
      return;
    }
    if (message.type !== 'ping' && message.type !== 'pong') {
      this.log('Sending controller message', message);
    }
    return this.controllerChannel.send(JSON.stringify(message));
  }

  private missingPeerResponseTimeout;
  private lastHeartbeatReceivedTime;
  private handleReceivedHeartbeat(receivedPing = false) {
    this.lastHeartbeatReceivedTime = performance.now();
    if (this.missingPeerResponseTimeout) {
      clearTimeout(this.missingPeerResponseTimeout)
      this.missingPeerResponseTimeout = null;
    }
    if (receivedPing) {
      this.sendControllerMessage({type: 'pong'});
    }
    this.missingPeerResponseTimeout = setTimeout(this.close, NO_RESPONSE_TIMEOUT);
  }

  private sendHeartbeat = () => {
    if (performance.now() - this.lastHeartbeatReceivedTime < HEARTBEAT_INTERVAL) {
      return;
    }
    this.sendControllerMessage({type: 'ping'});
  }

  close = () => {
    this.controllerChannel.close();
    // TODO: this makes nodejs segfault, should investigate why
    // this.connection.close();
    this.handleDisconnect();
    if (this.missingPeerResponseTimeout) {
      clearTimeout(this.missingPeerResponseTimeout)
      this.missingPeerResponseTimeout = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}


