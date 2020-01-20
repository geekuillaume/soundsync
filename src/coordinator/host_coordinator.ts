import debug from 'debug';
import _ from 'lodash';
import { AudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { WebrtcServer } from '../communication/wrtc_server';
import { AddLocalSourceMessage, AddSinkMessage, PeerConnectionInfoMessage } from '../communication/messages';
import { WebrtcPeer } from '../communication/wrtc_peer';
import { AudioSource } from '../audio/sources/audio_source';
import { AudioSink } from '../audio/sinks/audio_sink';
import { attachTimekeeperCoordinator } from './timekeeper';

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

    this.webrtcServer.on(`peerControllerMessage:addLocalSource`, ({peer, message}: {peer: WebrtcPeer, message: AddLocalSourceMessage}) => {
      // A peer has a new source, we need to register it and send it to everyone else
      this.handleNewSourceFromPeer(peer, message);
    });
    this.webrtcServer.on(`peerControllerMessage:requestSourcesList`, ({peer}: {peer: WebrtcPeer}) => {
      this.handleRequestSourceList(peer);
    });
    this.webrtcServer.on(`peerControllerMessage:addLocalSink`, ({peer, message}: {peer: WebrtcPeer, message: AddSinkMessage}) => {
      this.handleNewSinkFromPeer(peer, message);
    });
    this.webrtcServer.on(`peerControllerMessage:peerConnectionInfo`, ({peer, message}: {peer: WebrtcPeer, message: PeerConnectionInfoMessage}) => {
      this.handlePeerConnectionInfo(peer, message);
    });

    attachTimekeeperCoordinator(webrtcServer);
  }

  private handleNewSourceFromPeer = (peer: WebrtcPeer, message: AddLocalSourceMessage) => {
    this.log(`Received source ${message.name} (uuid: ${message.uuid}) from peer ${peer.uuid}`);
    // Sending new source info to all peers
    this.webrtcServer.broadcast({
      type: 'addRemoteSource',
      name: message.name,
      uuid: message.uuid,
      sourceType: message.sourceType,
      channels: message.channels,
      peerUuid: peer.uuid,
      latency: message.latency,
      startedAt: message.startedAt,
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
        peerUuid: source.peer.uuid,
        latency: source.latency,
        startedAt: source.startedAt,
      });
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

  private handlePeerConnectionInfo = (peer: WebrtcPeer, message: PeerConnectionInfoMessage) => {
    const targetPeer = this.webrtcServer.peers[message.peerUuid];
    if (!targetPeer) {
      this.log(`Tried to pass PeerConnectionInfo message to unknown peer ${message.peerUuid}`);
    }
    targetPeer.sendControllerMessage({
      type: 'peerConnectionInfo',
      peerUuid: peer.uuid,
      offer: message.offer,
      iceCandidates: message.iceCandidates,
    });
  }

  createPipe = (source: AudioSource, sink: AudioSink) => {
    if (_.some(this.pipes, (p) => p.source === source && p.sink === sink)) {
      return;
    }
    const pipe: Pipe = {
      source,
      sink,
    };
    this.pipes.push(pipe);
    sink.linkSource(source);
    const closePipe = () => {
      sink.unlinkSource();
      this.pipes = this.pipes.filter((pipe) => pipe.source !== source && pipe.sink !== sink)
    }
    source.peer.once('disconnected', closePipe);
    sink.peer.once('disconnected', closePipe);
  }

  destroyPipe = (source: AudioSource, sink: AudioSink) => {
    if (!_.some(this.pipes, (p) => p.source === source && p.sink === sink)) {
      return;
    }
    sink.unlinkSource();
    this.pipes = this.pipes.filter((pipe) => pipe.source !== source && pipe.sink !== sink)
  }
}
