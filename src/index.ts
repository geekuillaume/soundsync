import yargs from 'yargs';
import { createHttpServer } from './communication/http_server';
import { WebrtcServer, getWebrtcServer } from './communication/wrtc_server';
import { assert } from './utils/assert';
import { getAudioSourcesSinksManager } from './audio/audio_sources_sinks_manager';
import { HostCoordinator } from './coordinator/host_coordinator';
import { ClientCoordinator } from './coordinator/client_coordinator';
import { ApiController } from './api/api';
import { initConfig, getConfigField } from './coordinator/config';
import { createSystray } from './utils/systray';

const main = async () => {
  const argv = yargs
    .help('h')
    .option('startCoordinator', {
      type: 'boolean',
      description: 'Start a coordinator server other instance of SoundSync can use to join the network',
    })
    .option('coordinatorHost', {
      type: 'string',
      description: 'Coordinator host to connect to',
    })
    .option('api', {
      type: 'boolean',
      description: 'Enable the JSON REST API, only for coordinator',
      default: true,
    })
    .option('configDir', {
      type: 'string',
      description: 'Directory where the config and cache files can be found, if it doesn\'t exists it will be created',
    })
    .completion().parse(process.argv.slice(1));

  assert(!argv.startCoordinator || !argv.coordinatorHost, 'Cannot be coordinator and connect to another coordinator at the same time, use only one option');

  initConfig(argv.configDir);
  const webrtcServer = getWebrtcServer();
  const audioSourcesSinksManager = getAudioSourcesSinksManager();

  if (argv.startCoordinator) {
    const httpServer = await createHttpServer(6512);
    webrtcServer.attachToSignalingServer(httpServer);

    const hostCoordinator = new HostCoordinator(webrtcServer, audioSourcesSinksManager);
    if (argv.api) {
      const apiController = new ApiController(
        httpServer,
        hostCoordinator,
      )
    }
  } else {
    await webrtcServer.connectToCoordinatorHost(argv.coordinatorHost);
  }
  const clientCoordinator = new ClientCoordinator(webrtcServer, audioSourcesSinksManager, !!argv.startCoordinator);

  audioSourcesSinksManager.addFromConfig();
  if (getConfigField('autoDetectAudioDevices')) {
    audioSourcesSinksManager.autodetectDevices();
  }
  createSystray();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
})
