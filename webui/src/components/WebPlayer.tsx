import * as React from 'react';
import { initializeCoordinator } from '../utils/coordinator_communication';

export const WebPlayer = () => {
  // audioSourcesSinksManager.addSink({
  //   type: 'webaudio',
  //   name: 'Web Page Output',
  //   peerUuid: getLocalPeer().uuid,
  // });
  initializeCoordinator().catch((e) => console.error(e));
  return false;
};
