import React from 'react';
import './firstUse.css';

import { useIsConnected } from '../../utils/useSoundSyncState';
import { DownloadLinks } from './DownloadLinks';

export const FirstUse = () => {
  const isConnected = useIsConnected();

  if (isConnected) {
    return false;
  }

  return (
    <div className="container firstUseContainer">
      <p>Soundsync is scanning your local network for Soundsync enabled devices. Make sure Soundsync is started on your computer and that you are connected to the same network / wifi as the other devices.</p>
      <h4>Download Soundsync:</h4>
      <DownloadLinks />
    </div>
  );
};
