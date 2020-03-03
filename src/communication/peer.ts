import { EventEmitter } from 'events';
import { getPeersManager } from './peers_manager';
import {
  ControllerMessage,
} from './messages';
import { once } from '../utils/misc';

export abstract class Peer extends EventEmitter {
  uuid: string;
  name: string;
  host: string;
  state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  constructor({
    uuid, name, host,
  }) {
    super();
    this.setMaxListeners(1000);
    this.name = name;
    this.uuid = uuid;
    this.host = host;
    this.on(`controllerMessage:all`, ({ message }) => {
      getPeersManager().emit(`controllerMessage:${message.type}`, { message, peer: this });
    });
    this.on('connected', (shouldIgnore) => {
      if (shouldIgnore) {
        return;
      }
      getPeersManager().emit('newConnectedPeer', this);
    });
  }

  setUuid = (uuid: string) => {
    this.uuid = uuid;
  }

  waitForConnected = async () => {
    if (this.state === 'connected') {
      return;
    }
    await once(this, 'connected');
  }

  abstract sendControllerMessage(message: ControllerMessage): void;
}
