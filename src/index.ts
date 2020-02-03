import yargs from 'yargs';
import debug from 'debug';
import { createHttpServer } from './communication/http_server';
import { getWebrtcServer } from './communication/wrtc_server';
import { getAudioSourcesSinksManager } from './audio/audio_sources_sinks_manager';
import { HostCoordinator } from './coordinator/host_coordinator';
import { ClientCoordinator } from './coordinator/client_coordinator';
import { ApiController } from './api/api';
import { initConfig, getConfigField } from './coordinator/config';
import { createSystray, refreshMenu } from './utils/systray';
import { startDetection, waitForCoordinatorSelection, getCoordinatorFromConfig } from './communication/coordinatorDetector';

if (!process.env.DEBUG) {
  debug.enable('soundsync,soundsync:*,-soundsync:timekeeper,-soundsync:*:timekeepResponse,-soundsync:*:timekeepRequest,-soundsync:api');
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
    .completion().parse(process.argv.slice(1));

  initConfig(argv.configDir);
  const webrtcServer = getWebrtcServer();
  const audioSourcesSinksManager = getAudioSourcesSinksManager();

  audioSourcesSinksManager.addFromConfig();
  if (getConfigField('autoDetectAudioDevices')) {
    audioSourcesSinksManager.autodetectDevices();
  }

  createSystray();
  startDetection();
  l('Getting coordinator info from config file or from Tray interaction');
  const coordinatorChoice = await getCoordinatorFromConfig() || await waitForCoordinatorSelection();
  refreshMenu();

  if (coordinatorChoice.isCoordinator) {
    const httpServer = await createHttpServer(6512);
    webrtcServer.attachToSignalingServer(httpServer);

    const hostCoordinator = new HostCoordinator(webrtcServer, audioSourcesSinksManager);
    const apiController = new ApiController(
      httpServer,
      hostCoordinator,
    )
  } else {
    await webrtcServer.connectToCoordinatorHost(coordinatorChoice.coordinatorHost);
  }
  const clientCoordinator = new ClientCoordinator(webrtcServer, audioSourcesSinksManager, !!argv.startCoordinator);
  refreshMenu();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
})
