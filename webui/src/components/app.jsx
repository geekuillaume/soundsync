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

export const App = () => {
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
