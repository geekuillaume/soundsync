import { debounce, map } from 'lodash-es';
import { getAudioSourcesSinksManager } from '../serverSrc/audio/audio_sources_sinks_manager';
import { getWebrtcServer } from '../serverSrc/communication/wrtc_server';

import { registerLocalPeer } from '../serverSrc/communication/local_peer';
import { ClientCoordinator } from '../serverSrc/coordinator/client_coordinator';
import { initConfig, getConfigField } from '../serverSrc/coordinator/config';
import { waitForFirstTimeSync, attachTimekeeperClient } from '../serverSrc/coordinator/timekeeper';


let initializePromise: Promise;
let clientCoordinator: ClientCoordinator;

const initialize = async () => {
  const innerInitialize = async () => {
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
    clientCoordinator = new ClientCoordinator(webrtcServer, audioSourcesSinksManager);
  };
  if (initializePromise) {
    return initializePromise;
  }
  initializePromise = innerInitialize();
  return initializePromise;


  // audioSourcesSinksManager.addSink({
  //   type: 'webaudio',
  //   name: 'Web Page Output',
  //   peerUuid: getLocalPeer().uuid,
  // });
};

export const onSoundStateChange = async (listener) => {
  await initialize();
  const debouncedListener = debounce(listener);
  getAudioSourcesSinksManager().on('soundstateUpdated', debouncedListener);
};

export const getSoundState = async () => {
  await initialize();

  return {
    sources: getAudioSourcesSinksManager().sources.filter((s) => s.peer && s.peer.state === 'connected').map((source) => source.toObject()),
    sinks: getAudioSourcesSinksManager().sinks.filter((s) => s.peer && s.peer.state === 'connected').map((sink) => sink.toObject()),
    peers: map(getWebrtcServer().peers, (peer) => ({
      name: peer.name,
      uuid: peer.uuid,
      coordinator: peer.coordinator,
    })),
    pipes: clientCoordinator.pipes,
  };
};
