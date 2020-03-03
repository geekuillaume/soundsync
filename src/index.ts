import yargs from 'yargs';
import debug from 'debug';
import { enableAutolaunchAtStartup, disableAutolaunchAtStartup } from './utils/launchAtStartup';
import { waitForFirstTimeSync, attachTimekeeperClient } from './coordinator/timekeeper';
import { createHttpServer } from './communication/http_server';
import { getPeersManager } from './communication/peers_manager';
import { getAudioSourcesSinksManager } from './audio/audio_sources_sinks_manager';
import { getClientCoordinator } from './coordinator/client_coordinator';
// import { ApiController } from './api/api';
import { initConfig, getConfigField } from './coordinator/config';
import { createSystray, refreshMenu } from './utils/systray';
import {
  startDetection, publishService,
} from './communication/coordinatorDetector';
import { registerLocalPeer } from './communication/local_peer';


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

  startDetection();
  refreshMenu();

  try {
    const httpServer = await createHttpServer(6512);
    peersManager.attachToSignalingServer(httpServer);
    publishService(httpServer.port);
  } catch (e) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const apiController = new ApiController(
  //   httpServer,
  // );
  if (argv.connectWithHttp) {
    await peersManager.joinPeerWithHttpApi('http://localhost:6512');
  }
  attachTimekeeperClient(peersManager);
  // await waitForFirstTimeSync();

  getClientCoordinator();

  refreshMenu();
};

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

process.on('uncaughtException', (e) => {
  console.error(e);
  process.exit(1);
});

process.on('unhandledRejection', (e) => {
  console.error(e);
  process.exit(1);
});
