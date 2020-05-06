import { v4 as uuidv4 } from 'uuid';

export interface InitiatorMessage {
  senderUuid: string;
  senderInstanceUuid: string;
  senderVersion: string;
  description?: RTCSessionDescription;
  candidate?: RTCIceCandidate;
}

export interface InitiatorMessageContent {
  description?: RTCSessionDescription;
  candidate?: RTCIceCandidate;
}

export abstract class WebrtcInitiator {
  type: string;

  constructor(
    public uuid = uuidv4(),
    public handleReceiveMessage: (message: InitiatorMessage) => void,
  ) {}
  // TODO: add a way to clean initiators to prevent memory leak
  abstract sendMessage(message: InitiatorMessageContent): Promise<unknown>;

  destroy() {
    this.stopPolling();
  }

  startPolling() {}
  stopPolling() {}
}
