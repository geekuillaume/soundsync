import debug from 'debug';
import _ from 'lodash';
import { AudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { RTCIceCandidate } from 'wrtc';
import { WebrtcServer } from '../communication/wrtc_server';
import { AudioSource } from '../audio/audio_source';
import { ControllerMessage, CreatePipeMessage, AddRemoteSourceMessage, PeerConnectionInfoMessage } from '../communication/messages';
import { AudioSink } from '../audio/audio_sink';
import { WebrtcPeer } from '../communication/wrtc_peer';
import { waitUntilIceGatheringStateComplete } from '../utils/wait_for_ice_complete';

export class ClientCoordinator {
  webrtcServer: WebrtcServer;
  audioSourcesSinksManager: AudioSourcesSinksManager;
  log: debug.Debugger;

  constructor(webrtcServer: WebrtcServer, audioSourcesSinksManager: AudioSourcesSinksManager) {
    this.webrtcServer = webrtcServer;
    this.audioSourcesSinksManager = audioSourcesSinksManager;
    this.log = debug(`soundsync:hostCoordinator`);
    this.log(`Created client coordinator`);

    if (this.webrtcServer.coordinatorPeer.state === 'connected') {
      this.announceAllSourcesSinksToController();
    }
    this.webrtcServer.coordinatorPeer.on('connected', this.announceAllSourcesSinksToController);
    audioSourcesSinksManager.on('newLocalSource', this.announceSourceToController);
    audioSourcesSinksManager.on('newLocalSink', this.announceSinkToController);

    this.webrtcServer.on('newSourceChannel', this.handleNewSourceChannel);

    this.webrtcServer.coordinatorPeer.on('controllerMessage', ({message}: {message: ControllerMessage}) => {
      if (message.type === 'addRemoteSource') {
        this.handleAddRemoteSource(message);
      }
      if (message.type === 'removeRemoteSource') {
        this.audioSourcesSinksManager.removeSource(message.uuid);
      }
      if (message.type === 'createPipe') {
        this.handleCreatePipe(message);
      }
      if (message.type === 'peerConnectionInfo') {
        this.handlePeerConnectionInfo(message);
      }
    });

    this.webrtcServer.coordinatorPeer.waitForConnected().then(() => {
      this.webrtcServer.coordinatorPeer.sendControllerMessage({
        type: 'requestSourcesList',
      })
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
    this.webrtcServer.coordinatorPeer.sendControllerMessage({
      type: 'addLocalSource',
      name: source.name,
      sourceType: source.type,
      uuid: source.uuid,
      channels: source.channels,
    });
  }


  private handleAddRemoteSource = (message: AddRemoteSourceMessage) => {
    this.audioSourcesSinksManager.addSource({
      type: 'remote',
      name: message.name,
      uuid: message.uuid,
      channels: message.channels,
      peer: this.webrtcServer.getPeerByUuid(message.peerUuid),
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
