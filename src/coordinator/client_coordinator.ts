import { Coordinator } from './coordinator';
import { AudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { WebrtcServer } from '../communication/wrtc_server';
import { AudioSource } from '../audio/audio_source';
import { ControllerMessage } from '../communication/messages';
import { AudioSink } from '../audio/audio_sink';

export class ClientCoordinator extends Coordinator {
  constructor(webrtcServer: WebrtcServer, audioSourcesSinksManager: AudioSourcesSinksManager) {
    super(webrtcServer, audioSourcesSinksManager);
    this.log(`Created client coordinator`);

    audioSourcesSinksManager.on('newLocalSource', (source: AudioSource) => {
      this.webrtcServer.coordinatorPeer.sendControllerMessage({
        type: 'addLocalSource',
        name: source.name,
        sourceType: source.type,
        uuid: source.uuid,
        channels: source.channels,
      });
    });

    audioSourcesSinksManager.on('newLocalSink', (sink: AudioSink) => {
      this.webrtcServer.coordinatorPeer.sendControllerMessage({
        type: 'addLocalSink',
        name: sink.name,
        sinkType: sink.type,
        uuid: sink.uuid,
        channels: sink.channels,
      });
    });

    this.webrtcServer.coordinatorPeer.on('controllerMessage', (message: ControllerMessage) => {
      if (message.type === 'addRemoteSource') {
        this.audioSourcesSinksManager.addSource({
          type: 'remote',
          name: message.name,
          uuid: message.uuid,
          channels: message.channels,
        });
      }
      if (message.type === 'removeRemoteSource') {
        this.audioSourcesSinksManager.removeSource(message.uuid);
      }
    });

    this.webrtcServer.coordinatorPeer.on('connected', () => {
      this.webrtcServer.coordinatorPeer.sendControllerMessage({
        type: 'requestSourcesList',
      })
    });
  }

}
