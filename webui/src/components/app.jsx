import React from 'react';
import { Provider, CachePolicies } from 'use-http';
import { SoundState } from './SoundState';
import { SoundSyncProvider, useIsConnected } from '../utils/useSoundSyncState';
import { Header } from './Header';
import { FirstUse } from './FirstUse/FirstUse';

// port 1234 is dev server of Parcel, when using it we use the local soundsync server
const API_URL = document.location.host.endsWith(':1234') ? 'http://localhost:6512' : `http://${document.location.host}`;

export const App = () => {
  const isConnected = useIsConnected();

  return (
    <Provider
      url={API_URL}
      options={{ cachePolicy: CachePolicies.NO_CACHE }}
    >
      <SoundSyncProvider>
        <Header />
        <SoundState />
        {!isConnected && <FirstUse />}
      </SoundSyncProvider>
    </Provider>
  );
};
