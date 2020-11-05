import { InitiatorMessage, InitiatorMessageContent, WebrtcInitiator } from './initiator';

export class BasicInitiator extends WebrtcInitiator {
  type = 'basic';

  constructor(
    public handleReceiveMessage: (message: InitiatorMessage) => Promise<void>,
    public _sendMessage: (message: InitiatorMessageContent) => any,
  ) {
    super(null, handleReceiveMessage);
  }

  sendMessage = async (message: InitiatorMessageContent) => this._sendMessage(message)
}

export const createBasicInitiator = (messageHandler: (message: InitiatorMessageContent) => any) => (
  handleReceiveMessage: (message: InitiatorMessage) => Promise<void>,
) => (
  new BasicInitiator(handleReceiveMessage, messageHandler)
);
