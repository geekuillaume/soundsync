import { EventEmitter, once } from 'events';
import { ControllerMessage } from '../communication/messages';

export abstract class Peer extends EventEmitter {
  uuid: string;
  name: string;
  coordinator: boolean;
  state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  constructor({ uuid, name, coordinator = false }) {
    super();
    this.setMaxListeners(1000);
    this.name = name;
    this.uuid = uuid;
    this.coordinator = coordinator;
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
