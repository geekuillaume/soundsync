import { Peer } from '../peer';
import { SharedState, handleSharedStateFromPeer } from '../../coordinator/shared_state';

export const onSharedStateUpdate = async (_peer: Peer, sharedState: SharedState) => {
  handleSharedStateFromPeer(sharedState);
};
