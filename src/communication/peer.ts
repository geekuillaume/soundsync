import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

import debug, { l } from '../utils/environment/log';
import { NO_RESPONSE_TIMEOUT } from '../utils/constants';
import { BUILD_VERSION } from '../utils/version';
import { handleSharedStateFromPeer } from '../coordinator/shared_state';
import {
  RPCType, RPCRequestBody, RPCResponseBody, rpcHandlers,
} from './rpc/rpc';
import { getLocalPeer } from './local_peer';
import { getPeersManager } from './get_peers_manager';
import {
  ControllerMessage,
  ControllerMessageHandler,
  RPCMessage,
} from './messages';
import { now } from '../utils/misc';
import { Timekeeper } from '../utils/network/timekeeper';

export enum Capacity {
  Librespot = 'librespot',
  Shairport = 'shairport',
  HttpServerAccessible = 'http_server_accessible',
  Hue = 'hue',
  ChromecastInteraction = 'chromecast_interaction',
  SharedStateKeeper = 'shared_state_keeper', // a keeper can be trusted with not changing network of peer and can be considered a source of truth, this is useful to prevent the webui to leak state to another set of peer in another network
  AirplaySink = 'airplay_sink',
}

export abstract class Peer extends EventEmitter {
  uuid: string;
  instanceUuid: string;
  name: string;
  version: string;
  state: 'connecting' | 'connected' | 'deleted' = 'connecting';
  private timekeeper = new Timekeeper();
  log: debug.Debugger;
  protected logPerMessageType: {[type: string]: debug.Debugger} = {}; // we use this to prevent having to create a debug() instance on each message receive which cause a memory leak
  private rpcResponseHandlers: {[uuid: string]: (message: RPCMessage) => void} = {};
  capacities: Capacity[];
  isLocal: boolean;
  private onRemoteDisconnect: () => any;
  private missingPeerResponseTimeout: NodeJS.Timeout;

  constructor({
    uuid, name, capacities, instanceUuid, version,
  }: PeerDescriptor, { onRemoteDisconnect = () => {}, isLocal = false } = {}) {
    super();
    this.setMaxListeners(1000);
    this.isLocal = isLocal;
    this.name = name;
    this.uuid = uuid;
    this.log = l.extend(`peer:${uuid}`);
    this.instanceUuid = instanceUuid;
    this.capacities = capacities || [];
    this.version = version;
    this.onRemoteDisconnect = onRemoteDisconnect;
    this.log(`Created new peer`);
    this.onControllerMessage(`timekeepRequest`, (message) => {
      this.sendControllerMessage({
        type: 'timekeepResponse',
        sentAt: message.sentAt,
        respondedAt: now(),
      });
    });
    this.onControllerMessage(`timekeepResponse`, (message) => {
      this.timekeeper.handleResponse(message);
      this.emit('timesyncStateUpdated');
    });
    this.timekeeper.on('requestNeeded', (request) => {
      this.sendControllerMessage({
        type: 'timekeepRequest',
        ...request,
      });
    });
    this.timekeeper.on('deltaUpdated', (delta, previousDelta) => {
      this.log(`Updating timedelta to ${delta}, diff: ${(delta - previousDelta).toFixed(2)}ms`);
      this.emit('timedeltaUpdated');
    });

    this.onControllerMessage('peerInfo', (message) => {
      const existingPeer = getPeersManager().getConnectedPeerByUuid(message.peer.uuid);
      if (existingPeer) {
        if (existingPeer.instanceUuid === message.peer.instanceUuid) { // this is the same peer
          this.destroy('Peer is already connected, this is a duplicate');
          return;
        }
        // this is a new instance of the same peer, disconnect previous instance
        existingPeer.destroy('New instance of peer connected', { advertiseDestroy: true });
      }
      this.instanceUuid = message.peer.instanceUuid;
      this.name = message.peer.name;
      this.capacities = message.peer.capacities;
      this.uuid = message.peer.uuid;
      this.version = message.peer.version;
      if (this.state !== 'connected') {
        this.log = l.extend(`peer:${message.peer.uuid}`);
        this.setState('connected');
        this.log('Connected');
      }
      if (message.sharedState) {
        handleSharedStateFromPeer(message.sharedState);
      }
    });
    this.onControllerMessage('rpc', async (message) => {
      if (message.isResponse) {
        if (this.rpcResponseHandlers[message.uuid]) {
          this.rpcResponseHandlers[message.uuid](message);
        }
        return;
      }
      try {
        const body = await rpcHandlers[message.rpcType](this, message.body);
        this.sendControllerMessage({
          type: 'rpc',
          isResponse: true,
          body,
          uuid: message.uuid,
          rpcType: message.rpcType,
        });
      } catch (e) {
        this.sendControllerMessage({
          type: 'rpc',
          isResponse: true,
          isError: true,
          body: e.toString(),
          uuid: message.uuid,
          rpcType: message.rpcType,
        });
      }
    });
    this.on('stateChange', () => {
      if (this.state !== 'connected') {
        this.timekeeper.flush();
      }
      if (this.state === 'connected') {
        if (!this.isLocal) {
          this.timekeeper.start();
        }
        getPeersManager().emit('newConnectedPeer', this);
      }
    });
    getPeersManager().emit('peerChange', this);
  }

  setState = (state: 'connecting' | 'connected' | 'deleted') => {
    if (this.state === state) {
      return;
    }
    if (this.state === 'deleted') {
      return; // once it's deleted, it's not possible to go back to another state
    }
    this.state = state;
    // setImmediate is necessary to force same async behavior even for peer that are connected at start like local peer
    setImmediate(() => {
      this.emit('stateChange', this);
      getPeersManager().emit('peerChange', this);
      if (state === 'connected') {
        getPeersManager().emit('connectedPeer', this);
      }
    });
  }

  abstract sendControllerMessage(message: ControllerMessage): void;
  // need to be called by class which implement peer when a message is received
  protected _onReceivedMessage = (message) => {
    if (this.missingPeerResponseTimeout) {
      clearTimeout(this.missingPeerResponseTimeout);
    }
    if (!this.isLocal) {
      this.missingPeerResponseTimeout = setTimeout(this.handleNoResponseTimeout, NO_RESPONSE_TIMEOUT);
    }
    if (!this.logPerMessageType[message.type]) {
      this.logPerMessageType[message.type] = this.log.extend(message.type);
    }
    this.logPerMessageType[message.type]('Received controller message', message);
    this.emit(`controllerMessage:all`, { peer: this, message });
    this.emit(`controllerMessage:${message.type}`, { peer: this, message });
    getPeersManager().emit(`controllerMessage:${message.type}`, { message, peer: this });
  }

  private handleNoResponseTimeout = () => {
    this.destroy('no messages for a too long, timeout', { advertiseDestroy: true, canTryReconnect: true });
  }

  onControllerMessage: ControllerMessageHandler<this> = (type, handler) => this.on(`controllerMessage:${type}`, ({ message, peer }) => handler(message, peer))

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

  isTimeSynchronized = () => this === getLocalPeer() || this.timekeeper.isSynchronized()
  getCurrentTime = (realDelta = false) => {
    if (this === getLocalPeer()) {
      return now();
    }
    return now() + (realDelta ? this.timekeeper.rawDelta : this.timekeeper.delta);
  }

  destroy = (reason = 'unknown', { advertiseDestroy = false, canTryReconnect = false } = {}) => {
    if (this.state === 'deleted') {
      return;
    }
    if (advertiseDestroy) {
      this.sendControllerMessage({ type: 'disconnect' });
    }
    this.setState('deleted');
    this.log(`Destroying peer, reason: ${reason}`);
    this._destroy();
    getPeersManager().unregisterPeer(this);
    this.timekeeper.destroy();
    this.removeAllListeners();
    getPeersManager().emit('peerChange');
    if (this.onRemoteDisconnect && canTryReconnect) {
      this.onRemoteDisconnect();
    }
  }

  _destroy = () => undefined;

  toDescriptor = (): PeerDescriptor => ({
    uuid: this.uuid,
    name: this.name,
    instanceUuid: this.instanceUuid,
    capacities: this.capacities,
    version: BUILD_VERSION,
  })

  sendRcp = <T extends RPCType>(type: T, message: RPCRequestBody<T>) => new Promise<RPCResponseBody<T>>((resolve, reject) => {
    const uuid = uuidv4();
    this.rpcResponseHandlers[uuid] = (m) => {
      delete this.rpcResponseHandlers[uuid];
      if (m.isError) {
        reject(new Error(m.body));
      } else {
        resolve(m.body);
      }
    };
    this.sendControllerMessage({
      type: 'rpc',
      rpcType: type,
      isResponse: false,
      body: message,
      uuid,
    });
  })
}

export interface PeerDescriptor {
  uuid: string;
  // the instanceUuid changes between restarts
  instanceUuid: string;
  name: string;
  host?: string;
  capacities?: Capacity[];
  version?: string;
}
