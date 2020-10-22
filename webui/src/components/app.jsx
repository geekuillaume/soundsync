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
    primary: {
      main: '#0060dd',
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
  const {error, message} = hasNecessaryApi();
  if (error) {
    return (
      <div className="notsupported">
        <p>Your browser doesn't support the necessary web features to handle Soundsync. Chrome and Firefox are known to support Soundsync. Please download a compatible browser or update yours to use Soundsync.</p>
        <p>{message}</p>
      </div>
    );
  }

  const shouldRedirectToController = window.localStorage.getItem('soundsync:redirectToController') === 'true' ||
    document.location.hostname === 'localhost' ||
    document.location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/);

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
                <Redirect to={shouldRedirectToController ? '/controller' : '/landing'} />
              </Route>
            </Switch>
          </Router>
        </SoundSyncProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
};
