import yargs from 'yargs';
import debug from 'debug';
import { enableAutolaunchAtStartup, disableAutolaunchAtStartup } from './utils/launchAtStartup';
import { waitForFirstTimeSync, attachTimekeeperClient } from './coordinator/timekeeper';
import { createHttpServer } from './communication/http_server';
import { getWebrtcServer } from './communication/wrtc_server';
import { getAudioSourcesSinksManager } from './audio/audio_sources_sinks_manager';
import { HostCoordinator } from './coordinator/host_coordinator';
import { ClientCoordinator } from './coordinator/client_coordinator';
import { ApiController } from './api/api';
import { initConfig, getConfigField } from './coordinator/config';
import { createSystray, refreshMenu } from './utils/systray';
import {
  startDetection, waitForCoordinatorSelection, getCoordinatorFromConfig, publishService,
} from './communication/coordinatorDetector';
import { registerLocalPeer } from './communication/local_peer';


if (!process.env.DEBUG) {
  debug.enable('soundsync,soundsync:*,-soundsync:timekeeper,-soundsync:*:timekeepResponse,-soundsync:*:timekeepRequest,-soundsync:api,-soundsync:wrtcPeer:*:soundState,-soundsync:*:librespot');
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

  const webrtcServer = getWebrtcServer();
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
  l('Getting coordinator info from config file or from Tray interaction');
  const coordinatorChoice = await getCoordinatorFromConfig() || await waitForCoordinatorSelection();
  refreshMenu();

  if (coordinatorChoice.isCoordinator) {
    const httpServer = await createHttpServer(6512);
    webrtcServer.attachToSignalingServer(httpServer);
    publishService(httpServer.port);

    const hostCoordinator = new HostCoordinator(webrtcServer, audioSourcesSinksManager);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const apiController = new ApiController(
      httpServer,
      hostCoordinator,
    );
  } else {
    await webrtcServer.connectToCoordinatorHost(coordinatorChoice.coordinatorHost);
  }
  attachTimekeeperClient(webrtcServer);
  if (!coordinatorChoice.isCoordinator) {
    await waitForFirstTimeSync();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const clientCoordinator = new ClientCoordinator(webrtcServer, audioSourcesSinksManager);

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
