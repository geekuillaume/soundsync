import debug from 'debug';
import _ from 'lodash';
import { AudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { WebrtcServer } from '../communication/wrtc_server';
import { AudioSource } from '../audio/audio_source';
import { ControllerMessage } from '../communication/messages';
import { AudioSink } from '../audio/audio_sink';

export class ClientCoordinator {
  webrtcServer: WebrtcServer;
  audioSourcesSinksManager: AudioSourcesSinksManager;
  log: debug.Debugger;

  constructor(webrtcServer: WebrtcServer, audioSourcesSinksManager: AudioSourcesSinksManager) {
    this.webrtcServer = webrtcServer;
    this.audioSourcesSinksManager = audioSourcesSinksManager;
    this.log = debug(`soundsync:hostCoordinator`);
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
      if (message.type === 'createPipe') {
        const sink = _.find(this.audioSourcesSinksManager.sinks, {uuid: message.sinkUuid});
        if (!sink) {
          this.log(`Trying to create pipe with unknown sink (uuid ${message.sinkUuid})`);
          return;
        }
        const source = _.find(this.audioSourcesSinksManager.sources, {uuid: message.sourceUuid});
        if (!source) {
          this.log(`Trying to create pipe with unknown source (uuid ${message.sinkUuid})`);
          return;
        }
        this.log(`Creating pipe sink ${message.sinkUuid} and source ${message.sourceUuid}`);
        sink.linkSource(source);
      }
    });

    this.webrtcServer.coordinatorPeer.waitForConnected().then(() => {
      this.webrtcServer.coordinatorPeer.sendControllerMessage({
        type: 'requestSourcesList',
      })
    });
  }

}
