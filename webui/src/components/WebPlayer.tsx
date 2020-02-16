import * as React from 'react';

let isInitialized = false;

const initialize = async () => {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  const [
    { getWebrtcServer },
    { registerLocalPeer, getLocalPeer },
    { getAudioSourcesSinksManager },
    { ClientCoordinator },
    { initConfig, getConfigField },
    { waitForFirstTimeSync, attachTimekeeperClient },
  ] = await Promise.all([
    import('../serverSrc/communication/wrtc_server'),
    import('../serverSrc/communication/local_peer'),
    import('../serverSrc/audio/audio_sources_sinks_manager'),
    import('../serverSrc/coordinator/client_coordinator'),
    import('../serverSrc/coordinator/config'),
    import('../serverSrc/coordinator/timekeeper'),
  ]);

  initConfig();
  registerLocalPeer({
    name: 'Web page',
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
    name: 'Web Page Output',
    peerUuid: getLocalPeer().uuid,
  });
};

export const WebPlayer = () => {
  initialize().catch((e) => console.error(e));
  return false;
};
