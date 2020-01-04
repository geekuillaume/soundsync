import { Coordinator } from './coordinator';
import { AudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { WebrtcServer } from '../communication/wrtc_server';
import { ControllerMessage, AddSourceMessage, AddSinkMessage } from '../communication/messages';
import { WebrtcPeer } from '../communication/wrtc_peer';
import { SinkType } from '../audio/sink_type';

interface RemoteSink {
  name: string;
  uuid: string;
  type: SinkType;
  peer: WebrtcPeer;
}

export class HostCoordinator extends Coordinator {
  sinks: RemoteSink[] = [];

  constructor(webrtcServer: WebrtcServer, audioSourceManager: AudioSourcesSinksManager) {
    super(webrtcServer, audioSourceManager);
    this.log(`Created host coordinator`);

    this.webrtcServer.on('controllerMessage', ({peer, message}: {peer: WebrtcPeer, message: ControllerMessage}) => {
      if (message.type === 'addLocalSource') {
        // A peer has a new source, we need to register it and send it to everyone else
        this.handleNewSourceFromPeer(peer, message);
      }
      if (message.type === 'requestSourcesList') {
        this.handleRequestSourceList(peer);
      }
      if (message.type === 'addLocalSink') {
        this.handleNewSinkFromPeer(peer, message);
      }
    });
  }

  private handleNewSourceFromPeer = (peer: WebrtcPeer, message: AddSourceMessage) => {
    this.log(`Registering new source ${message.name} (uuid: ${message.uuid}) from peer ${peer.uuid}`);
    // Adding source to own Source Manager
    this.audioSourcesSinksManager.addSource({
      type: 'remote',
      name: message.name,
      uuid: message.uuid,
      channels: message.channels,
      peer,
    });
    // Sending new source info to all peers
    this.webrtcServer.broadcast({
      type: 'addRemoteSource',
      name: message.name,
      uuid: message.uuid,
      sourceType: message.sourceType,
      channels: message.channels,
    }, [peer.uuid]);

    peer.once('disconnected', () => {
      this.audioSourcesSinksManager.removeSource(message.uuid);
      this.webrtcServer.broadcast({
        type: 'removeRemoteSource',
        uuid: message.uuid,
      }, [peer.uuid]);
    });
  }

  private handleRequestSourceList = (peer: WebrtcPeer) => {
    this.audioSourcesSinksManager.sources.map((source) => {
      peer.sendControllerMessage({
        type: 'addRemoteSource',
        name: source.name,
        uuid: source.uuid,
        sourceType: source.type,
        channels: source.channels,
      })
    })
  }

  private handleNewSinkFromPeer = (peer: WebrtcPeer, message: AddSinkMessage) => {
    this.log(`Registering new sink ${message.name} (uuid: ${message.uuid}) from peer ${peer.uuid}`);
    this.sinks.push({
      name: message.name,
      type: message.sinkType,
      uuid: message.uuid,
      peer,
    });
    peer.once('disconnected', () => {
      this.sinks = this.sinks.filter(({uuid}) => uuid !== message.uuid);
    });
  }
}
