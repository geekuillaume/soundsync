import { v4 as uuidv4 } from 'uuid';
import { ControllerMessage } from './messages';
import { Peer, PeerDescriptor } from './peer';
import { getPeersManager } from './get_peers_manager';

class LocalPeer extends Peer {
  constructor({
    uuid, name, capacities, instanceUuid,
  }: PeerDescriptor) {
    super({
      uuid,
      name,
      capacities,
      instanceUuid,
    });
    this.log(`Registering local peer with instaceUuid: ${this.instanceUuid}`);
    this.isLocal = true;
    this.sendControllerMessage({
      type: 'peerInfo',
      peer: this.toDescriptor(),
    });
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
  getPeersManager().registerPeer(localPeer);
};

export const getLocalPeer = () => {
  if (!localPeer) {
    throw new Error('Local peer is not registered yet');
  }
  return localPeer;
};
