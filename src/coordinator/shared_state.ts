import produce from 'immer';
import { getConfigField, setConfig } from './config';
import { getPeersManager } from '../communication/get_peers_manager';

export interface SharedState {
  hueBridges: {
    host: string;
    username: string;
    clientKey: string;
  }[];
  lastUpdateTimestamp: number;
}

export const patchSharedState = (setter: (sharedState: SharedState) => SharedState) => {
  const newSharedState = produce(getConfigField('sharedState'), (draft) => {
    draft.lastUpdateTimestamp = new Date().getTime();
    return setter(draft);
  });
  getPeersManager().broadcastRpc('updateSharedState', newSharedState);
};

export const handleSharedStateFromPeer = (sharedState: SharedState) => {
  if (sharedState.lastUpdateTimestamp < getConfigField('sharedState').lastUpdateTimestamp) {
    return;
  }
  setConfig((c) => {
    c.sharedState = sharedState;
  });
};
