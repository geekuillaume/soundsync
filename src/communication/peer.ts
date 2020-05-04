import { EventEmitter } from 'events';
import _ from 'lodash';
import debug, { Debugger } from 'debug';
import { getLocalPeer } from './local_peer';
import { getPeersManager } from './peers_manager';
import {
  ControllerMessage,
  ControllerMessageHandler,
} from './messages';
import { now } from '../utils/time';
import { TIMEKEEPER_REFRESH_INTERVAL } from '../utils/constants';

const TIME_DELTAS_TO_KEEP = 10;
// if there is less than this diff between the newly computed time delta and the saved time delta, update it and emit a event
// this is used to not reupdate the sound sinks for every small difference in the timedelta but only if there is too much diff
const MS_DIFF_TO_UPDATE_TIME_DELTA = 20;
// we use multiple time requests when starting the connection to prevent having a incorrect value from a network problem at this specific moment
const TIMESYNC_INIT_REQUEST_COUNT = 3;

export enum Capacity {
  Librespot = 'librespot',
  Shairport = 'shairport',
}

export abstract class Peer extends EventEmitter {
  uuid: string;
  instanceUuid: string;
  name: string;
  host: string;
  state: 'disconnected' | 'connecting' | 'connected' | 'deleted' = 'disconnected';
  timeDelta = 0;
  private _previousTimeDeltas: number[] = [];
  log: Debugger;
  capacities: Capacity[];
  isLocal: boolean;

  constructor({
    uuid, name, capacities, host, instanceUuid,
  }: PeerDescriptor) {
    super();
    this.setMaxListeners(1000);
    this.isLocal = false;
    this.name = name;
    this.uuid = uuid;
    this.host = host;
    this.instanceUuid = instanceUuid;
    this.capacities = capacities || [];
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
      const realTimeDelta = _.mean(this._previousTimeDeltas);
      if (Math.abs(realTimeDelta - this.timeDelta) > MS_DIFF_TO_UPDATE_TIME_DELTA) {
        this.timeDelta = realTimeDelta;
        this.log(`Updating timedelta to ${realTimeDelta}`);
        this.emit('timedeltaUpdated');
      }
      this.emit('timesyncStateUpdated');
      // networkLatency = roundtripTime / 2;
    });
    setInterval(this._sendTimekeepRequest, TIMEKEEPER_REFRESH_INTERVAL);

    this.onControllerMessage('peerInfo', (message) => {
      this.name = message.peer.name;
      this.capacities = message.peer.capacities;
    });
    this.on('stateChange', () => {
      if (this.state !== 'connected') {
        return;
      }
      if (this.isLocal) {
        return;
      }
      this.sendControllerMessage({
        type: 'peerInfo',
        peer: getLocalPeer().toDescriptor(),
      });
      getPeersManager().emit('newConnectedPeer', this);
      _.times(TIMESYNC_INIT_REQUEST_COUNT, (i) => {
        setTimeout(this._sendTimekeepRequest, i * 10); // 10 ms between each request
      });
    });
  }

  setState = (state: 'disconnected' | 'connecting' | 'connected' | 'deleted') => {
    if (this.state === state) {
      return;
    }
    // setImmediate is necessary to force same async behavior even for peer that are connected at start like local peer
    setImmediate(() => {
      this.state = state;
      this.emit('stateChange', this);
      getPeersManager().emit('peerChange', this);
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
    delete getPeersManager().peers[this.uuid];
    this.uuid = uuid;
    if (getPeersManager().peers[uuid] && getPeersManager().peers[uuid] !== this) {
      throw new Error('A peer with this uuid already exists');
    }
    getPeersManager().peers[uuid] = this;
    this.log = debug(`soundsync:peer:${uuid}`);
  }

  waitForConnected = async () => {
    if (this.state === 'connected') {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const listener = () => {
        if (this.state === 'connected') {
          return;
        }
        this.removeListener('stateChange', listener);
        resolve();
      };
      this.addListener('stateChange', listener);
    });
  }

  waitForFirstTimeSync = async () => {
    if (this.isTimeSynchronized()) {
      return true;
    }
    return new Promise((r) => {
      const timesyncStateUpdatedHandler = () => {
        if (!this.isTimeSynchronized()) {
          this.off('timesyncStateUpdated', timesyncStateUpdatedHandler);
          r();
        }
      };
      this.on('timesyncStateUpdated', timesyncStateUpdatedHandler);
    });
  }

  isTimeSynchronized = () => this === getLocalPeer() || this._previousTimeDeltas.length >= TIMESYNC_INIT_REQUEST_COUNT
  getCurrentTime = () => (this === getLocalPeer() ? now() : now() + this.timeDelta);
  private _sendTimekeepRequest = () => {
    this.sendControllerMessage({
      type: 'timekeepRequest',
      sentAt: now(),
    });
  }

  delete = () => {
    this.state = 'deleted';
    delete getPeersManager().peers[this.uuid];
    this.removeAllListeners();
  }

  toDescriptor = (): PeerDescriptor => ({
    uuid: this.uuid,
    name: this.name,
    instanceUuid: this.instanceUuid,
    capacities: this.capacities,
  })
}

export interface PeerDescriptor {
  uuid: string;
  // the instanceUuid changes between restarts
  instanceUuid: string;
  name: string;
  host?: string;
  capacities?: Capacity[];
}
