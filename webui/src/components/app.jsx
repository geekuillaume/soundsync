import React, { useEffect } from 'react';
import { SnackbarProvider } from 'notistack';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useLocation,
} from 'react-router-dom';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import { SoundState } from './SoundState';
import { SoundSyncProvider } from '../utils/useSoundSyncState';
import { Header } from './Header';
import { ChromecastView } from './ChromecastView/ChromecastView.tsx';
import { hasNecessaryApi } from '../utils/hasNecessaryApi';
import { LandingPage } from './LandingPage/LandingPage.tsx';
import { captureEvent } from '../../../src/utils/vendor_integrations/posthog';

const theme = createMuiTheme({
  // background: '#F8FAFF',
  palette: {
    background: {
      default: '#F8FAFF',
    },
  },
});

const PageviewTracker = () => {
  const location = useLocation();
  useEffect(() => {
    captureEvent('$pageview');
  }, [location]);
  return false;
};

export const App = () => {
  if (!hasNecessaryApi()) {
    return (
      <>
        <p>Your browser doesn't support the necessary web features to handle Soundsync. Chrome and Firefox are known to support Soundsync. Please download a compatible browser or update yours to use Soundsync.</p>
      </>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider>
        <SoundSyncProvider>
          <Router>
            <PageviewTracker />
            <Switch>
              <Route path="/chromecast">
                <ChromecastView />
              </Route>
              <Route path="/controller">
                <Header />
                <SoundState />
              </Route>
              <Route path="/landing">
                <LandingPage />
              </Route>
              <Route path="/">
                <Redirect to={window.localStorage.getItem('soundsync:redirectToController') === 'true' ? '/controller' : '/landing'} />
              </Route>
            </Switch>
          </Router>
        </SoundSyncProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
};
