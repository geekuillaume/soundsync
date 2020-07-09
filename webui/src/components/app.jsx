import React from 'react';
import { SnackbarProvider } from 'notistack';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

import { SoundState } from './SoundState';
import { SoundSyncProvider } from '../utils/useSoundSyncState';
import { Header } from './Header';
import { FirstUse } from './FirstUse/FirstUse';
import { ChromecastView } from './ChromecastView/ChromecastView.tsx';
import { hasNecessaryApi } from '../utils/hasNecessaryApi';

export const App = () => {
  if (!hasNecessaryApi()) {
    return (
      <>
        <p>Your browser doesn't support the necessary web features to handle Soundsync. Chrome and Firefox are known to support Soundsync. Please download a compatible browser or update yours to use Soundsync.</p>
      </>
    )
  }
  return (
    <SnackbarProvider>
      <SoundSyncProvider>
        <Router>
          <Switch>
            <Route path="/chromecast">
              <ChromecastView />
            </Route>
            <Route path="/">
              <Header />
              <SoundState />
              <FirstUse />
            </Route>
          </Switch>
        </Router>
      </SoundSyncProvider>
    </SnackbarProvider>
  );
};
