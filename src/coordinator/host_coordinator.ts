import debug from 'debug';
import _ from 'lodash';
import { AudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { WebrtcServer } from '../communication/wrtc_server';
import { AddLocalSourceMessage, AddSinkMessage, PeerConnectionInfoMessage, SinkLatencyUpdateMessage } from '../communication/messages';
import { WebrtcPeer } from '../communication/wrtc_peer';
import { AudioSource } from '../audio/sources/audio_source';
import { AudioSink } from '../audio/sinks/audio_sink';
import { attachTimekeeperCoordinator } from './timekeeper';
import { FORCED_STREAM_LATENCY } from '../utils/constants';
import { Pipe } from './pipe';
import { updateConfigArrayItem, deleteConfigArrayItem, getConfigField } from './config';

export class HostCoordinator {
  webrtcServer: WebrtcServer;
  audioSourcesSinksManager: AudioSourcesSinksManager;
  log: debug.Debugger;

  pipes: Pipe[] = getConfigField('pipes').map((p) => new Pipe(p.sourceUuid, p.sinkUuid));

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
    this.webrtcServer.on(`peerControllerMessage:sinkLatencyUpdate`, ({peer, message}: {peer: WebrtcPeer, message: SinkLatencyUpdateMessage}) => {
      this.handleSinkLatencyUpdate(peer, message);
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

    const relatedPipe = _.find(this.pipes, {sourceUuid: message.uuid});
    if (relatedPipe) {
      relatedPipe.activate();
    }
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

    const relatedPipe = _.find(this.pipes, {sinkUuid: message.uuid});
    if (relatedPipe) {
      relatedPipe.activate();
    }
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

  private handleSinkLatencyUpdate = (peer: WebrtcPeer, message: SinkLatencyUpdateMessage) => {
    const pipes = this.pipes.filter((p) => p.sink.uuid === message.sinkUuid);
    pipes.forEach((p) => {
      p.latency = message.latency;
      p.source.updateInfo({
        latency: Math.max(...pipes.filter(({source}) => source === p.source).map(({latency}) => latency)) + FORCED_STREAM_LATENCY,
      })
    });
  }

  createPipe = (source: AudioSource, sink: AudioSink) => {
    if (_.some(this.pipes, (p) => p.source === source && p.sink === sink)) {
      return;
    }
    const pipe = new Pipe(source.uuid, sink.uuid)
    this.pipes.push(pipe);
    updateConfigArrayItem('pipes', pipe.toDescriptor());
    pipe.activate();
  }

  destroyPipe = (source: AudioSource, sink: AudioSink) => {
    const pipe = _.find(this.pipes, (p) => p.source === source && p.sink === sink);
    if (!pipe) {
      return;
    }
    sink.unlinkSource();
    this.pipes = this.pipes.filter((p) => pipe !== p)
    deleteConfigArrayItem('pipes', pipe.toDescriptor());
  }
}
