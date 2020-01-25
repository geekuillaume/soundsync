import debug from 'debug';
import _ from 'lodash';
import { AudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
// import { RTCIceCandidate } from 'wrtc';
import { WebrtcServer } from '../communication/wrtc_server';
import { AudioSource } from '../audio/sources/audio_source';
import { CreatePipeMessage, AddRemoteSourceMessage, PeerConnectionInfoMessage, RemoveSourceMessage, RemovePipeMessage } from '../communication/messages';
import { AudioSink } from '../audio/sinks/audio_sink';
import { WebrtcPeer } from '../communication/wrtc_peer';
// import { waitUntilIceGatheringStateComplete } from '../utils/wait_for_ice_complete';
import { attachTimekeeperClient } from './timekeeper';
import { once } from 'events';

export class ClientCoordinator {
  webrtcServer: WebrtcServer;
  audioSourcesSinksManager: AudioSourcesSinksManager;
  log: debug.Debugger;

  constructor(webrtcServer: WebrtcServer, audioSourcesSinksManager: AudioSourcesSinksManager, isCoordinator = false) {
    this.webrtcServer = webrtcServer;
    this.audioSourcesSinksManager = audioSourcesSinksManager;
    this.log = debug(`soundsync:clientCoordinator`);
    this.log(`Created client coordinator`);

    this.webrtcServer.on('newSourceChannel', this.handleNewSourceChannel);

    this.webrtcServer.coordinatorPeer.on('controllerMessage:addRemoteSource', ({message}: {message: AddRemoteSourceMessage}) => {
      this.handleAddRemoteSource(message);
    });
    this.webrtcServer.coordinatorPeer.on('controllerMessage:removeRemoteSource', ({message}: {message: RemoveSourceMessage}) => {
      this.audioSourcesSinksManager.removeSource(message.uuid);
    });
    this.webrtcServer.coordinatorPeer.on('controllerMessage:createPipe', ({message}: {message: CreatePipeMessage}) => {
      this.handleCreatePipe(message);
    });
    this.webrtcServer.coordinatorPeer.on('controllerMessage:removePipe', this.handleRemovePipe);
    this.webrtcServer.coordinatorPeer.on('controllerMessage:peerConnectionInfo', ({message}: {message: PeerConnectionInfoMessage}) => {
      this.handlePeerConnectionInfo(message);
    });

    this.webrtcServer.coordinatorPeer.waitForConnected().then(async () => {
      this.webrtcServer.coordinatorPeer.sendControllerMessage({
        type: 'requestSourcesList',
      })
      this.announceAllSourcesSinksToController();
      audioSourcesSinksManager.on('newLocalSink', this.announceSinkToController);
      audioSourcesSinksManager.on('sinkLatencyUpdate', this.announceNewSinkLatency);
      audioSourcesSinksManager.on('sourceUpdate', this.announceSourceToController);
      if (!isCoordinator) {
        attachTimekeeperClient(webrtcServer);
      }
    });
  }

  private announceAllSourcesSinksToController = () => {
    this.audioSourcesSinksManager.sinks.forEach(this.announceSinkToController);
    this.audioSourcesSinksManager.sources.forEach(this.announceSourceToController);
  }

  private announceSinkToController = (sink: AudioSink) => {
    this.webrtcServer.coordinatorPeer.sendControllerMessage({
      type: 'addLocalSink',
      name: sink.name,
      sinkType: sink.type,
      uuid: sink.uuid,
      channels: sink.channels,
    });
  }

  private announceSourceToController = (source: AudioSource) => {
    if (source.type === 'remote') {
      return;
    }
    this.webrtcServer.coordinatorPeer.sendControllerMessage({
      type: 'addLocalSource',
      name: source.name,
      sourceType: source.type,
      uuid: source.uuid,
      channels: source.channels,
      latency: source.latency,
      startedAt: source.startedAt,
    });
  }

  private announceNewSinkLatency = (sink: AudioSink) => {
    this.webrtcServer.coordinatorPeer.sendControllerMessage({
      type: 'sinkLatencyUpdate',
      sinkUuid: sink.uuid,
      latency: sink.latency,
    });
  }

  private handleAddRemoteSource = (message: AddRemoteSourceMessage) => {
    this.audioSourcesSinksManager.addSource({
      type: 'remote',
      remoteType: message.sourceType,
      name: message.name,
      uuid: message.uuid,
      channels: message.channels,
      peer: this.webrtcServer.getPeerByUuid(message.peerUuid),
      latency: message.latency,
      startedAt: message.startedAt,
    });
  }

  private handleCreatePipe = (message: CreatePipeMessage) => {
    const sink = _.find(this.audioSourcesSinksManager.sinks, {uuid: message.sinkUuid});
    if (!sink) {
      this.log(`Trying to create pipe with unknown sink (uuid ${message.sinkUuid})`);
      return;
    }
    const source = _.find(this.audioSourcesSinksManager.sources, {uuid: message.sourceUuid});
    if (!source) {
      this.log(`Trying to create pipe with unknown source (uuid ${message.sourceUuid})`);
      return;
    }
    this.log(`Creating pipe sink ${message.sinkUuid} and source ${message.sourceUuid}`);
    sink.linkSource(source);
  }

  private handleRemovePipe = ({message}: {message: RemovePipeMessage}) => {
    console.log(message);
    const sink = _.find(this.audioSourcesSinksManager.sinks, {uuid: message.sinkUuid});
    if (!sink) {
      this.log(`Trying to remove pipe with unknown sink (uuid ${message.sinkUuid})`);
      return;
    }
    sink.unlinkSource();
  }

  private handlePeerConnectionInfo = async (message: PeerConnectionInfoMessage) => {
    const peer = this.webrtcServer.getPeerByUuid(message.peerUuid);
    if (!(peer instanceof WebrtcPeer)) {
      return;
    }
    if (message.offer) {
      // @ts-ignore
      await peer.connection.setRemoteDescription(message.offer);
      const answer = await peer.connection.createAnswer()
      peer.connection.setLocalDescription(answer);

      this.webrtcServer.coordinatorPeer.sendControllerMessage({
        type: 'peerConnectionInfo',
        peerUuid: peer.uuid,
        offer: peer.connection.localDescription,
      });
    }
    // if (message.iceCandidates) {
    //   for (const iceCandidate of message.iceCandidates) {
    //     // @ts-ignore
    //     await peer.connection.addIceCandidate(new RTCIceCandidate({ candidate: iceCandidate }));
    //   }
    // }
  }

  private handleNewSourceChannel = async ({sourceUuid, stream}: {sourceUuid: string, stream: NodeJS.WritableStream}) => {
    const source = _.find(this.audioSourcesSinksManager.sources, {uuid: sourceUuid});
    if (!source) {
      this.log(`Trying to request channel to unknown source (uuid ${sourceUuid})`);
      return;
    }
    const sourceStream = await source.start();
    sourceStream.pipe(stream);
  }
}
