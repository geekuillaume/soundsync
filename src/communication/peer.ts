import { EventEmitter, once } from 'events';
import {
  ControllerMessage,
  LightMessage,
  SourceInfoMessage,
  RemoveSourceMessage,
  SinkInfoMessage,
  PeerConnectionInfoMessage,
  TimekeepRequest,
  TimekeepResponse,
  SoundStateMessage,
} from './messages';

export abstract class Peer extends EventEmitter {
  uuid: string;
  name: string;
  host: string;
  coordinator: boolean;
  state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  constructor({
    uuid, name, coordinator = false, host,
  }) {
    super();
    this.setMaxListeners(1000);
    this.name = name;
    this.uuid = uuid;
    this.coordinator = coordinator;
    this.host = host;
  }

  onControllerMessage(type: LightMessage['type'], handler: (message: LightMessage, peer: Peer) => any): this;
  onControllerMessage(type: SourceInfoMessage['type'], handler: (message: SourceInfoMessage, peer: Peer) => any): this;
  onControllerMessage(type: RemoveSourceMessage['type'], handler: (message: RemoveSourceMessage, peer: Peer) => any): this;
  onControllerMessage(type: SinkInfoMessage['type'], handler: (message: SinkInfoMessage, peer: Peer) => any): this;
  onControllerMessage(type: PeerConnectionInfoMessage['type'], handler: (message: PeerConnectionInfoMessage, peer: Peer) => any): this;
  onControllerMessage(type: TimekeepRequest['type'], handler: (message: TimekeepRequest, peer: Peer) => any): this;
  onControllerMessage(type: TimekeepResponse['type'], handler: (message: TimekeepResponse, peer: Peer) => any): this;
  onControllerMessage(type: SoundStateMessage['type'], handler: (message: SoundStateMessage, peer: Peer) => any): this;
  onControllerMessage(type, handler) {
    return this.on(`controllerMessage:${type}`, ({ message, peer }) => handler(message, peer));
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
