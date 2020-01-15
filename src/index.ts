import yargs from 'yargs';
import { createHttpServer } from './communication/http_server';
import { WebrtcServer } from './communication/wrtc_server';
import { assert } from './utils/assert';
import { AudioSourcesSinksManager } from './audio/audio_sources_sinks_manager';
import { HostCoordinator } from './coordinator/host_coordinator';
import { ClientCoordinator } from './coordinator/client_coordinator';
import { ApiController } from './api/api';

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
    .option('autodetectAudioDevices', {
      type: 'boolean',
      description: 'Autodetect and create matching source / sink for every audio device on current host'
    })
    .option('api', {
      type: 'boolean',
      description: 'Enable the JSON REST API, only for coordinator',
      default: true,
    })
    .option('librespot', {
      type: 'boolean',
      description: 'Enable a Spotify connect server with Librespot',
    })
    .completion().argv;

  assert(!argv.startCoordinator || !argv.coordinatorHost, 'Cannot be coordinator and connect to another coordinator at the same time, use only one option');
  assert(argv.startCoordinator || argv.coordinatorHost, 'Need to be a coordinator or connect to one');

  const webrtcServer = new WebrtcServer();
  const audioSourcesSinksManager = new AudioSourcesSinksManager({
    autodetect: argv.autodetectAudioDevices,
  });

  if (argv.startCoordinator) {
    const httpServer = await createHttpServer(8080);
    webrtcServer.attachToSignalingServer(httpServer);

    const hostCoordinator = new HostCoordinator(webrtcServer, audioSourcesSinksManager);
    if (argv.api) {
      const apiController = new ApiController(
        httpServer,
        hostCoordinator,
        audioSourcesSinksManager,
        webrtcServer,
      )
    }
  } else if (argv.coordinatorHost) {
    await webrtcServer.connectToCoordinatorHost(argv.coordinatorHost);
  }

  const clientCoordinator = new ClientCoordinator(webrtcServer, audioSourcesSinksManager, !!argv.startCoordinator);

  if (argv.librespot) {
    audioSourcesSinksManager.addSource({
      type: 'librespot',
      name: 'Librespot',
      librespotOptions: {
        name: 'Soundsync'
      },
    });
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
})
