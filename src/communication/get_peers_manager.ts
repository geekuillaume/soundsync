import { PeersManager } from './peers_manager';

let peersManager: PeersManager = null;

export const getPeersManager = () => {
  if (!peersManager) {
    throw new Error('Peer manager not registered');
  }
  return peersManager;
};

export const registerPeersManager = (pm) => {
  peersManager = pm;
};
