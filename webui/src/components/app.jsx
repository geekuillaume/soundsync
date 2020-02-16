import React from 'react';
import { Provider, CachePolicies } from 'use-http';
import { SoundState } from './SoundState';
import { SoundSyncProvider } from '../utils/useSoundSyncState';
import { WebPlayer } from './WebPlayer';

// port 1234 is dev server of Parcel, when using it we use the local soundsync server
const API_URL = document.location.host.endsWith(':1234') ? 'http://localhost:6512' : `http://${document.location.host}`;

export const App = () => (
  <Provider
    url={API_URL}
    options={{ cachePolicy: CachePolicies.NO_CACHE }}
  >
    <SoundSyncProvider>
      <WebPlayer />
      <section className="hero is-dark is-bold">
        <div className="hero-head">
          <nav className="navbar">
            <div className="container">
              <div className="navbar-brand">
                <span className="navbar-burger burger" data-target="navbarMenuHeroA">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
              <div id="navbarMenuHeroA" className="navbar-menu">
                <div className="navbar-end">
                  <a className="navbar-item is-active">
                    State
                  </a>
                </div>
              </div>
            </div>
          </nav>
        </div>
        <div className="hero-body">
          <div className="container">
            <h1 className="title">SoundSync</h1>
          </div>
        </div>
      </section>
      <SoundState />
    </SoundSyncProvider>
  </Provider>
);
