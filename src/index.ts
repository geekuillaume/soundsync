import yargs from 'yargs';
import debug from 'debug';
import { attachApi } from './api/api';
import { enableAutolaunchAtStartup, disableAutolaunchAtStartup } from './utils/launchAtStartup';
import { createHttpServer } from './communication/http_server';
import { getPeersManager } from './communication/peers_manager';
import { getAudioSourcesSinksManager } from './audio/audio_sources_sinks_manager';
import { getClientCoordinator } from './coordinator/client_coordinator';
// import { ApiController } from './api/api';
import { initConfig, getConfigField } from './coordinator/config';
import { createSystray, refreshMenu } from './utils/systray';
import {
  startDetection, publishService, onDetectionChange,
} from './communication/bonjour';
import { registerLocalPeer } from './communication/local_peer';
import { Capacity } from './communication/peer';


if (!process.env.DEBUG) {
  debug.enable('soundsync,soundsync:*,-soundsync:timekeeper,-soundsync:*:timekeepResponse,-soundsync:*:timekeepRequest,-soundsync:*:peerDiscovery,-soundsync:api,-soundsync:wrtcPeer:*:soundState,-soundsync:*:librespot');
}
const l = debug('soundsync');

const main = async () => {
  l('Starting soundsync');
  const argv = yargs
    .help('h')
    .option('configDir', {
      type: 'string',
      description: 'Directory where the config and cache files can be found, if it doesn\'t exists it will be created',
    })
    .option('launchAtStartup', {
      type: 'boolean',
      description: 'Register this process to be launched at startup',
    })
    .completion()
    .parse(process.argv.slice(1));

  initConfig(argv.configDir);
  registerLocalPeer({
    name: getConfigField('name'),
    uuid: getConfigField('uuid'),
    capacities: [Capacity.Librespot],
  });

  const peersManager = getPeersManager();
  const audioSourcesSinksManager = getAudioSourcesSinksManager();

  audioSourcesSinksManager.addFromConfig();
  if (getConfigField('autoDetectAudioDevices')) {
    audioSourcesSinksManager.autodetectDevices();
  }

  if (argv.launchAtStartup === true) {
    await enableAutolaunchAtStartup();
  } else if (argv.launchAtStartup === false) {
    await disableAutolaunchAtStartup();
  }

  createSystray();
  startDetection();
  refreshMenu();

  try {
    const httpServer = await createHttpServer(getConfigField('port'));
    peersManager.attachToSignalingServer(httpServer);
    attachApi(httpServer);
    publishService(httpServer.port);
  } catch (e) {}

  getConfigField('peers').forEach((peerHost) => {
    peersManager.joinPeerWithHttpApi(peerHost);
  });

  onDetectionChange((services) => {
    services.forEach((service) => {
      const uuid = service.name.match(/SoundSync @ (.*)/)[1];
      if (!peersManager.peers[uuid]) {
        // @ts-ignore
        peersManager.joinPeerWithHttpApi(`${service.addresses[0]}:${service.port}`, uuid);
      }
    });
  });

  getClientCoordinator();
};

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

process.on('uncaughtException', (e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

process.on('unhandledRejection', (e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
