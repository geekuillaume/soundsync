import { ControllerMessage } from './messages';
import { Peer } from './peer';

class LocalPeer extends Peer {
  constructor({ uuid, name }) {
    super({ uuid, name, host: '127.0.0.1' });
    this.state = 'connected';
    this.emit('connected', true);
  }

  sendControllerMessage(message: ControllerMessage) {
    this._onReceivedMessage(message);
  }
}

let localPeer: LocalPeer;
export const registerLocalPeer = ({ name, uuid }) => {
  localPeer = new LocalPeer({ name, uuid });
};

export const getLocalPeer = () => {
  if (!localPeer) {
    throw new Error('Local peer is not registered yet');
  }
  return localPeer;
};
