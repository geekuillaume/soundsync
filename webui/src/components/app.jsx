import React from 'react';
import { SnackbarProvider } from 'notistack';

import { SoundState } from './SoundState';
import { SoundSyncProvider } from '../utils/useSoundSyncState';
import { Header } from './Header';
import { FirstUse } from './FirstUse/FirstUse';

export const App = () => {
  return (
    <SnackbarProvider>
      <SoundSyncProvider>
        <Header />
        <SoundState />
        <FirstUse />
      </SoundSyncProvider>
    </SnackbarProvider>
  );
};
