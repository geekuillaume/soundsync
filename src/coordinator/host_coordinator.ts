import debug from 'debug';
import { AudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { WebrtcServer } from '../communication/wrtc_server';
import { ControllerMessage, AddSourceMessage, AddSinkMessage } from '../communication/messages';
import { WebrtcPeer } from '../communication/wrtc_peer';
import { AudioSource } from '../audio/audio_source';
import { AudioSink } from '../audio/audio_sink';

interface Pipe {
  source: AudioSource;
  sink: AudioSink;
}

export class HostCoordinator {
  webrtcServer: WebrtcServer;
  audioSourcesSinksManager: AudioSourcesSinksManager;
  log: debug.Debugger;

  pipes: Pipe[] = [];

  constructor(webrtcServer: WebrtcServer, audioSourcesSinksManager: AudioSourcesSinksManager) {
    this.webrtcServer = webrtcServer;
    this.audioSourcesSinksManager = audioSourcesSinksManager;
    this.log = debug(`soundsync:hostCoordinator`);
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
    // Sending new source info to all peers
    this.webrtcServer.broadcast({
      type: 'addRemoteSource',
      name: message.name,
      uuid: message.uuid,
      sourceType: message.sourceType,
      channels: message.channels,
    }, [peer.uuid]);

    peer.once('disconnected', () => {
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
    this.audioSourcesSinksManager.addSink({
      type: 'remote',
      name: message.name,
      uuid: message.uuid,
      peer,
      channels: message.channels,
    });
    peer.once('disconnected', () => {
      this.audioSourcesSinksManager.removeSink(message.uuid);
    });
  }

  createPipe = (source: AudioSource, sink: AudioSink) => {
    const pipe: Pipe = {
      source,
      sink,
    };
    this.pipes.push(pipe);
    sink.linkSource(source);
    return pipe;
  }
}
