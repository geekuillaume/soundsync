import React from 'react';
import {Provider} from 'use-http';
import { SoundState } from './SoundState';
import { SoundSyncProvider } from '../utils/useSoundSyncState';

export const App = () => {
  return (
    <Provider url="http://localhost:6512">
      <SoundSyncProvider>
        <section className="hero is-dark is-bold">
          <div className="hero-head">
            <nav className="navbar">
              <div className="container">
                <div className="navbar-brand">
                  <span className="navbar-burger burger" data-target="navbarMenuHeroA">
                    <span></span>
                    <span></span>
                    <span></span>
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
  )
}
