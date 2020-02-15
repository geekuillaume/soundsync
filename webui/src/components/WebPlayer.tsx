import * as React from 'react';

import { getWebrtcServer } from '../serverSrc/communication/wrtc_server';
import { registerLocalPeer, getLocalPeer } from '../serverSrc/communication/local_peer';
import { getAudioSourcesSinksManager } from '../serverSrc/audio/audio_sources_sinks_manager';
import { ClientCoordinator } from '../serverSrc/coordinator/client_coordinator';
import { initConfig, getConfig, getConfigField } from '../serverSrc/coordinator/config';
import { waitForFirstTimeSync, attachTimekeeperClient } from '../serverSrc/coordinator/timekeeper';

let isInitialized = false;

const initialize = async () => {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  initConfig();
  registerLocalPeer({
    name: 'webclient',
    uuid: getConfigField('uuid'),
  });

  const webrtcServer = getWebrtcServer();
  await webrtcServer.connectToCoordinatorHost('http://127.0.0.1:6512');


  const audioSourcesSinksManager = getAudioSourcesSinksManager();
  audioSourcesSinksManager.addFromConfig();
  attachTimekeeperClient(webrtcServer);
  await waitForFirstTimeSync();
  const clientCoordinator = new ClientCoordinator(webrtcServer, audioSourcesSinksManager);

  audioSourcesSinksManager.addSink({
    type: 'webaudio',
    name: 'WebAudio',
    peerUuid: getLocalPeer().uuid,
  });
};

export const WebPlayer = () => {
  initialize().catch((e) => console.error(e));
  return (
    <div>coucou</div>
  );
};
