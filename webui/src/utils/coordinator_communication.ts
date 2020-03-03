import { debounce, map } from 'lodash-es';
import { getAudioSourcesSinksManager } from '../serverSrc/audio/audio_sources_sinks_manager';
import { getPeersManager } from '../serverSrc/communication/peers_manager';

import { registerLocalPeer } from '../serverSrc/communication/local_peer';
import { ClientCoordinator, getClientCoordinator } from '../serverSrc/coordinator/client_coordinator';
import { initConfig, getConfigField } from '../serverSrc/coordinator/config';
import { waitForFirstTimeSync, attachTimekeeperClient } from '../serverSrc/coordinator/timekeeper';

initConfig();
registerLocalPeer({
  name: 'Web page',
  uuid: getConfigField('uuid'),
});

let initializePromise: Promise;
let clientCoordinator: ClientCoordinator;

export const initializeCoordinator = async () => {
  const innerInitialize = async () => {
    const peersManager = getPeersManager();
    await peersManager.joinPeerWithHttpApi('http://127.0.0.1:6512');

    const audioSourcesSinksManager = getAudioSourcesSinksManager();
    audioSourcesSinksManager.addFromConfig();
    // attachTimekeeperClient(peersManager);
    // await waitForFirstTimeSync();
    clientCoordinator = getClientCoordinator();
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
  await initializeCoordinator();
  const debouncedListener = debounce(listener);
  getAudioSourcesSinksManager().on('soundstateUpdated', debouncedListener);
};

export const getSoundState = async () => {
  await initializeCoordinator();

  return {
    sources: getAudioSourcesSinksManager().sources.filter((s) => s.peer && s.peer.state === 'connected').map((source) => source.toObject()),
    sinks: getAudioSourcesSinksManager().sinks.filter((s) => s.peer && s.peer.state === 'connected').map((sink) => sink.toObject()),
    peers: map(getPeersManager().peers, (peer) => ({
      name: peer.name,
      uuid: peer.uuid,
    })),
  };
};
