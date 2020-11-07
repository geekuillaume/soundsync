import { v4 as uuidv4 } from 'uuid';
import { debounce, memoize } from 'lodash-es';
import { getAudioSourcesSinksManager, registerAudioSourcesSinksManager } from '../../../src/audio/get_audio_sources_sinks_manager';
import { getPeersManager, registerPeersManager } from '../../../src/communication/get_peers_manager';
import { enableRendezvousServicePeersDetection } from '../../../src/communication/rendezvous_service';

import { registerLocalPeer, getLocalPeer } from '../../../src/communication/local_peer';
import { getClientCoordinator } from '../../../src/coordinator/client_coordinator';
import { initConfig, getConfigField } from '../../../src/coordinator/config';
import { PeersManager } from '../../../src/communication/peers_manager';
import { RENDEZVOUS_SERVICE_URL } from '../../../src/utils/constants';
import { AudioSourcesSinksManager } from '../../../src/audio/audio_sources_sinks_manager';

const IS_CHROMECAST = document.location.pathname === '/chromecast';

initConfig();
registerPeersManager(new PeersManager());
registerAudioSourcesSinksManager(new AudioSourcesSinksManager());
registerLocalPeer({
  name: IS_CHROMECAST ? 'Chromecast' : 'Web page',
  uuid: getConfigField('uuid'),
  capacities: [],
});

export const initializeCoordinator = memoize(async () => {
  // The chromecast check is useful to prevent a chromecast from connecting to a local peer when developping with another hostname than soundsync.app (for example a localtunnel like ngrok)
  if (!IS_CHROMECAST && !RENDEZVOUS_SERVICE_URL.endsWith(document.location.host) && !localStorage.getItem('soundsync:disableConnectToLocalPeer')) {
    const peerHost = document.location.port === '8080' ? `//${document.location.hostname}:6512` : `//${document.location.host}`;
    await getPeersManager().joinPeerWithHttpApi(peerHost);
  }
  if (localStorage.getItem('soundsync:forceConnectToPeer')) {
    getPeersManager().joinPeerWithHttpApi(localStorage.getItem('soundsync:forceConnectToPeer'));
  }

  const audioSourcesSinksManager = getAudioSourcesSinksManager();
  audioSourcesSinksManager.addFromConfig();

  getClientCoordinator();
  if (
    !IS_CHROMECAST && // chromecast webaudio sink is created in ChromecastView.tsx to name it properly with the name info from calling peer
    !window.location.search.includes('disable-local-sink=true') &&
    !audioSourcesSinksManager.sinks.find((sink) => sink.peerUuid === getLocalPeer().uuid && sink.type === 'webaudio')
  ) {
    audioSourcesSinksManager.addSink({
      type: 'webaudio',
      name: 'Web Browser',
      peerUuid: getLocalPeer().uuid,
      uuid: uuidv4(),
      volume: 1,
      available: true,
      pipedFrom: null,
    });
  }
  // If it's a chromecast, we don't need to use the rendezvous service as we are connecting directly with the peer who initiated the chromecast app
  if (!IS_CHROMECAST && localStorage.getItem('soundsync:disableRendezvousService') === null || localStorage.getItem('soundsync:disableRendezvousService') === 'false') {
    enableRendezvousServicePeersDetection(true);
    setInterval(() => {
      if (!getPeersManager().isConnectedToAtLeastOnePeer()) {
        enableRendezvousServicePeersDetection(true);
      }
    }, 5000);
  }
});

export const onSoundStateChange = async (listener) => {
  await initializeCoordinator();

  const debouncedListener = debounce(listener);
  getAudioSourcesSinksManager().on('soundstateUpdated', debouncedListener);
};

export const onPeersChange = async (listener) => {
  await initializeCoordinator();
  const debouncedListener = debounce(listener);
  getPeersManager().on('peerChange', debouncedListener);
};
