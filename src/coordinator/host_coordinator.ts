import debug from 'debug';
import _ from 'lodash';
import { AudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { WebrtcServer } from '../communication/wrtc_server';
import { SourceInfoMessage, SinkInfoMessage, PeerConnectionInfoMessage } from '../communication/messages';
import { WebrtcPeer } from '../communication/wrtc_peer';
import { AudioSource } from '../audio/sources/audio_source';
import { AudioSink } from '../audio/sinks/audio_sink';
import { attachTimekeeperCoordinator } from './timekeeper';
import { PipeDescriptor } from './pipe';
import { updateConfigArrayItem, deleteConfigArrayItem, getConfigField } from './config';
import { SourceDescriptor, BaseSourceDescriptor } from '../audio/sources/source_type';
import { SinkDescriptor, BaseSinkDescriptor } from '../audio/sinks/sink_type';

export class HostCoordinator {
  webrtcServer: WebrtcServer;
  audioSourcesSinksManager: AudioSourcesSinksManager;
  log: debug.Debugger;

  pipes: PipeDescriptor[] = getConfigField('pipes');
  sources: {[key: string]: SourceDescriptor} = {};
  sinks: {[key: string]: SinkDescriptor} = {};

  constructor(webrtcServer: WebrtcServer, audioSourcesSinksManager: AudioSourcesSinksManager) {
    this.webrtcServer = webrtcServer;
    this.audioSourcesSinksManager = audioSourcesSinksManager;
    this.log = debug(`soundsync:hostCoordinator`);
    this.log(`Created host coordinator`);

    this.webrtcServer.on(`peerControllerMessage:sourceInfo`, ({ peer, message }: {peer: WebrtcPeer; message: SourceInfoMessage}) => {
      this.handleSourceInfo(peer, message);
    });
    this.webrtcServer.on(`peerControllerMessage:sinkInfo`, ({ peer, message }: {peer: WebrtcPeer; message: SinkInfoMessage}) => {
      this.handleSinkInfo(peer, message);
    });
    this.webrtcServer.on(`peerControllerMessage:requestSoundState`, ({ peer }: {peer: WebrtcPeer}) => {
      this.handleRequestSourceList(peer);
    });
    this.webrtcServer.on(`peerControllerMessage:peerConnectionInfo`, ({ peer, message }: {peer: WebrtcPeer; message: PeerConnectionInfoMessage}) => {
      this.handlePeerConnectionInfo(peer, message);
    });

    attachTimekeeperCoordinator(webrtcServer);
  }

  private broadcastState = async () => {
    await this.webrtcServer.broadcast({
      type: 'soundState',
      sinks: this.sinks,
      sources: this.sources,
      pipes: this.pipes,
    });
  }

  private handleSourceInfo = async (peer: WebrtcPeer, message: SourceInfoMessage) => {
    const descriptor: BaseSourceDescriptor = {
      uuid: message.uuid,
      type: message.sourceType,
      peerUuid: peer.uuid,
      name: message.name,
      channels: message.channels,
      startedAt: message.startedAt,
      latency: message.latency,
    };
    this.sources[descriptor.uuid] = descriptor;
    this.broadcastState();
    // TODO: handle disconnect of peer
    // peer.once('disconnected', () => {
    //   this.webrtcServer.broadcast({
    //     type: 'removeRemoteSource',
    //     uuid: message.uuid,
    //   }, [peer.uuid]);
    // });
  }

  private handleRequestSourceList = (peer: WebrtcPeer) => {
    peer.sendControllerMessage({
      type: 'soundState',
      sinks: this.sinks,
      sources: this.sources,
      pipes: this.pipes,
    });
  }

  private handleSinkInfo = (peer: WebrtcPeer, message: SinkInfoMessage) => {
    const descriptor: BaseSinkDescriptor = {
      uuid: message.uuid,
      type: message.sinkType,
      peerUuid: peer.uuid,
      name: message.name,
      latency: message.latency,
    };
    this.sinks[descriptor.uuid] = descriptor;
    this.broadcastState();
    // TODO: handle disconnect of peer
  }

  private handlePeerConnectionInfo = (peer: WebrtcPeer, message: PeerConnectionInfoMessage) => {
    const targetPeer = this.webrtcServer.peers[message.peerUuid];
    if (!targetPeer) {
      this.log(`Tried to pass PeerConnectionInfo message to unknown peer ${message.peerUuid}`);
      return;
    }
    targetPeer.sendControllerMessage({
      type: 'peerConnectionInfo',
      peerUuid: peer.uuid,
      offer: message.offer,
      iceCandidates: message.iceCandidates,
    });
  }

  // private handleSinkLatencyUpdate = (peer: WebrtcPeer, message: SinkLatencyUpdateMessage) => {
  //   const pipes = this.pipes.filter((p) => p.sink && p.sink.uuid === message.sinkUuid);
  //   pipes.forEach((p) => {
  //     p.latency = message.latency;
  //     p.source.updateInfo({
  //       latency: Math.max(...pipes.filter(({source}) => source === p.source).map(({latency}) => latency)) + FORCED_STREAM_LATENCY,
  //     })
  //   });
  // }

  createPipe = (source: AudioSource, sink: AudioSink) => {
    if (_.some(this.pipes, (p) => p.sourceUuid === source.uuid && p.sinkUuid === sink.uuid)) {
      return;
    }
    const pipe: PipeDescriptor = {
      sourceUuid: source.uuid,
      sinkUuid: sink.uuid,
    };
    updateConfigArrayItem('pipes', pipe);
    this.pipes = getConfigField('pipes');

    this.broadcastState();
  }

  destroyPipe = (source: AudioSource, sink: AudioSink) => {
    const pipe = _.find(this.pipes, (p) => p.sourceUuid === source.uuid && p.sinkUuid === sink.uuid);
    if (!pipe) {
      return;
    }
    this.pipes = this.pipes.filter((p) => pipe !== p);
    deleteConfigArrayItem('pipes', pipe);
    this.broadcastState();
  }
}
