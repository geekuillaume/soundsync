import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './components/app';
import 'bulma';
import './styles.scss';
import 'typeface-roboto';
import '../../src/utils/sentry';

const mountNode = document.getElementById('app');
ReactDOM.render(<App />, mountNode);

// @ts-ignore
window.soundsyncDebug = () => {
  localStorage.debug = "soundsync,soundsync:*,-soundsync:timekeeper,-soundsync:*:timekeepResponse,-soundsync:*:timekeepRequest,-soundsync:*:peerDiscovery,-soundsync:api,-soundsync:wrtcPeer:*:soundState,-soundsync:*:librespot,-soundsync:*:peerSoundState,-soundsync:*:peerConnectionInfo";
  localStorage['soundsync:debug'] = true;
  document.location.reload();
}
