import { ControllerMessage } from './messages';
import { Peer, PeerDescriptor } from './peer';

class LocalPeer extends Peer {
  constructor({ uuid, name, capacities }: PeerDescriptor) {
    super({
      uuid, name, host: '127.0.0.1', capacities,
    });
    this.state = 'connected';
    this.emit('connected', true);
  }

  sendControllerMessage(message: ControllerMessage) {
    this._onReceivedMessage(message);
  }
}

let localPeer: LocalPeer;
export const registerLocalPeer = ({ name, uuid, capacities }: PeerDescriptor) => {
  localPeer = new LocalPeer({ name, uuid, capacities });
};

export const getLocalPeer = () => {
  if (!localPeer) {
    throw new Error('Local peer is not registered yet');
  }
  return localPeer;
};
