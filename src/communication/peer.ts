import { EventEmitter } from 'events';
import _ from 'lodash';
import debug, { Debugger } from 'debug';
import { getPeersManager } from './peers_manager';
import {
  ControllerMessage,
  ControllerMessageHandler,
} from './messages';
import { once } from '../utils/misc';
import { now } from '../utils/time';
import { TIMEKEEPER_REFRESH_INTERVAL } from '../utils/constants';

const TIME_DELTAS_TO_KEEP = 10;

export abstract class Peer extends EventEmitter {
  uuid: string;
  name: string;
  host: string;
  state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  timeDelta = 0;
  private _previousTimeDeltas: number[] = [];
  log: Debugger;

  constructor({
    uuid, name, host,
  }) {
    super();
    this.setMaxListeners(1000);
    this.name = name;
    this.uuid = uuid;
    this.host = host;
    this.log = debug(`soundsync:peer:${uuid}`);
    this.log(`Created new peer`);
    this.onControllerMessage(`timekeepRequest`, (message) => {
      this.sendControllerMessage({
        type: 'timekeepResponse',
        sentAt: message.sentAt,
        respondedAt: now(),
      });
    });
    this.onControllerMessage(`timekeepResponse`, (message) => {
      const receivedAt = now();
      const roundtripTime = receivedAt - message.sentAt;
      const receivedByPeerAt = message.sentAt + (roundtripTime / 2);
      const delta = message.respondedAt - receivedByPeerAt;
      this._previousTimeDeltas.unshift(delta);
      this._previousTimeDeltas.splice(TIME_DELTAS_TO_KEEP);
      this.timeDelta = _.mean(this._previousTimeDeltas);
      // networkLatency = roundtripTime / 2;
    });
    setInterval(this._sendTimekeepRequest, TIMEKEEPER_REFRESH_INTERVAL);
    this.on('connected', (shouldIgnore) => {
      if (shouldIgnore) {
        return;
      }
      getPeersManager().emit('newConnectedPeer', this);
      this._sendTimekeepRequest();
    });
  }

  abstract sendControllerMessage(message: ControllerMessage): void;
  // need to be called by class which implement peer when a message is received
  protected _onReceivedMessage = (message) => {
    this.log.extend(message.type)('Received controller message', message);
    this.emit(`controllerMessage:all`, { peer: this, message });
    this.emit(`controllerMessage:${message.type}`, { peer: this, message });
    getPeersManager().emit(`controllerMessage:${message.type}`, { message, peer: this });
  }

  onControllerMessage: ControllerMessageHandler<this> = (type, handler) => this.on(`controllerMessage:${type}`, ({ message, peer }) => handler(message, peer))

  setUuid = (uuid: string) => {
    this.uuid = uuid;
    this.log = debug(`soundsync:peer:${uuid}`);
  }

  waitForConnected = async () => {
    if (this.state === 'connected') {
      return;
    }
    await once(this, 'connected');
  }

  getCurrentTime = () => now() + this.timeDelta;
  private _sendTimekeepRequest = () => {
    this.sendControllerMessage({
      type: 'timekeepRequest',
      sentAt: now(),
    });
  }
}
