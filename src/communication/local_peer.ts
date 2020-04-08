import { v4 as uuidv4 } from 'uuid';
import { ControllerMessage } from './messages';
import { Peer, PeerDescriptor } from './peer';

class LocalPeer extends Peer {
  constructor({
    uuid, name, capacities, instanceUuid,
  }: PeerDescriptor) {
    super({
      uuid,
      name,
      host: '127.0.0.1',
      capacities,
      instanceUuid,
    });
    this.isLocal = true;
    this.setState('connected');
  }

  sendControllerMessage(message: ControllerMessage) {
    this._onReceivedMessage(message);
  }
}

let localPeer: LocalPeer;
export const registerLocalPeer = ({ name, uuid, capacities }: Partial<PeerDescriptor>) => {
  if (localPeer) {
    throw new Error('Local peer is already registered');
  }
  localPeer = new LocalPeer({
    name, uuid, capacities, instanceUuid: uuidv4(),
  });
};

export const getLocalPeer = () => {
  if (!localPeer) {
    throw new Error('Local peer is not registered yet');
  }
  return localPeer;
};
