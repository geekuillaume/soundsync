import { EventEmitter } from 'events';
import { ControllerMessage } from '../communication/messages';

export abstract class Peer extends EventEmitter {
  uuid: string;
  name: string;
  state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  constructor({ uuid, name }) {
    super();
    this.name = name;
    this.uuid = uuid;
  }

  setUuid = (uuid: string) => {
    this.uuid = uuid;
  }

  waitForConnected = async () => {
    if (this.state === 'connected') {
      return;
    }
    await new Promise((resolve) => {
      this.once('connected', resolve);
    });
  }

  abstract sendControllerMessage(message: ControllerMessage): void;
}
