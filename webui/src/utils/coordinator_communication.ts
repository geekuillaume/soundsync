import { debounce, map, memoize } from 'lodash-es';
import { getAudioSourcesSinksManager } from '../../../src/audio/audio_sources_sinks_manager';
import { getPeersManager, registerPeersManager } from '../../../src/communication/get_peers_manager';
import { enableRendezvousServicePeersDetection } from '../../../src/communication/rendezvous_service';

import { registerLocalPeer, getLocalPeer } from '../../../src/communication/local_peer';
import { getClientCoordinator } from '../../../src/coordinator/client_coordinator';
import { initConfig, getConfigField } from '../../../src/coordinator/config';
import { PeersManager } from '../../../src/communication/peers_manager';
import { RENDEZVOUS_SERVICE_URL } from '../../../src/utils/constants';

initConfig();
registerPeersManager(new PeersManager());
registerLocalPeer({
  name: 'Web page',
  uuid: getConfigField('uuid'),
  capacities: [],
});

export const initializeCoordinator = memoize(async () => {
  if (!RENDEZVOUS_SERVICE_URL.endsWith(document.location.host)) {
    const peerHost = document.location.port === '8080' ? `http://${document.location.hostname}:6512` : `http://${document.location.host}`;
    await getPeersManager().joinPeerWithHttpApi(peerHost);
  }

  const audioSourcesSinksManager = getAudioSourcesSinksManager();
  audioSourcesSinksManager.addFromConfig();

  getClientCoordinator();
  if (!audioSourcesSinksManager.sinks.filter((sink) => sink.peerUuid === getLocalPeer().uuid && sink.type === 'webaudio').length) {
    audioSourcesSinksManager.addSink({
      type: 'webaudio',
      name: 'Web Page Output',
      peerUuid: getLocalPeer().uuid,
      volume: 1,
      available: true,
      pipedFrom: null,
    });
  }
  if (!localStorage.soundsync_disable_rendezvous_service) {
    enableRendezvousServicePeersDetection(true);
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
