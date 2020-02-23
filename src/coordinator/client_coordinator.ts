import debug from 'debug';
import _ from 'lodash';
import { AudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { WebrtcServer } from '../communication/wrtc_server';
import { AudioSource } from '../audio/sources/audio_source';
import {
  PeerConnectionInfoMessage,
  SoundStateMessage,
  SinkInfoMessage,
  SourceInfoMessage,
} from '../communication/messages';
import { AudioSink } from '../audio/sinks/audio_sink';
import { WebrtcPeer } from '../communication/wrtc_peer';
// import { waitUntilIceGatheringStateComplete } from '../utils/wait_for_ice_complete';
import { getLocalPeer } from '../communication/local_peer';
import { Pipe } from './pipe';

export class ClientCoordinator {
  webrtcServer: WebrtcServer;
  audioSourcesSinksManager: AudioSourcesSinksManager;
  log: debug.Debugger;
  pipes: Pipe[] = [];

  constructor(webrtcServer: WebrtcServer, audioSourcesSinksManager: AudioSourcesSinksManager) {
    this.webrtcServer = webrtcServer;
    this.audioSourcesSinksManager = audioSourcesSinksManager;
    this.log = debug(`soundsync:clientCoordinator`);
    this.log(`Created client coordinator`);

    this.webrtcServer.on('newSourceChannel', this.handleNewSourceChannel);

    this.webrtcServer.coordinatorPeer
      .onControllerMessage('peerConnectionInfo', this.handlePeerConnectionInfo)
      .onControllerMessage('soundState', this.handleSoundStateUpdate)
      .onControllerMessage('sinkInfo', this.handleSinkUpdate)
      .onControllerMessage('sourceInfo', this.handleSourceUpdate);

    this.webrtcServer.coordinatorPeer.waitForConnected().then(async () => {
      this.webrtcServer.coordinatorPeer.sendControllerMessage({
        type: 'requestSoundState',
      });
      this.announceAllSourcesSinksToController();
      audioSourcesSinksManager.on('newLocalSink', this.announceSinkToController);
      audioSourcesSinksManager.on('newLocalSource', this.announceSourceToController);
      audioSourcesSinksManager.on('sinkUpdate', this.announceSinkToController);
      audioSourcesSinksManager.on('sourceUpdate', this.announceSourceToController);
    });
  }

  private announceAllSourcesSinksToController = () => {
    this.audioSourcesSinksManager.sinks.forEach(this.announceSinkToController);
    this.audioSourcesSinksManager.sources.forEach(this.announceSourceToController);
  }

  private announceSinkToController = (sink: AudioSink) => {
    if (!sink.local) {
      return;
    }
    this.webrtcServer.coordinatorPeer.sendControllerMessage({
      type: 'sinkInfo',
      name: sink.name,
      sinkType: sink.type,
      uuid: sink.uuid,
      channels: sink.channels,
      latency: sink.latency,
      instanceUuid: sink.instanceUuid,
    });
  }

  private announceSourceToController = (source: AudioSource) => {
    if (!source.local) {
      return;
    }
    this.webrtcServer.coordinatorPeer.sendControllerMessage({
      type: 'sourceInfo',
      name: source.name,
      sourceType: source.type,
      uuid: source.uuid,
      channels: source.channels,
      latency: source.latency,
      startedAt: source.startedAt,
      peerUuid: getLocalPeer().uuid,
      instanceUuid: source.instanceUuid,
    });
  }

  private handleSoundStateUpdate = (message: SoundStateMessage) => {
    Object.keys(message.sources).forEach((sourceUuid) => {
      const source = message.sources[sourceUuid];
      this.audioSourcesSinksManager.addSource(source);
    });
    Object.keys(message.sinks).forEach((sinkUuid) => {
      const sink = message.sinks[sinkUuid];
      this.audioSourcesSinksManager.addSink(sink);
    });
    this.audioSourcesSinksManager.sources.forEach((source) => {
      if (!message.sources[source.uuid] && !source.local) {
        this.audioSourcesSinksManager.removeSource(source.uuid);
      }
    });
    this.audioSourcesSinksManager.sinks.forEach((sink) => {
      if (!message.sinks[sink.uuid] && !sink.local) {
        this.audioSourcesSinksManager.removeSink(sink.uuid);
      }
    });

    message.pipes.forEach((pipeDescriptor) => {
      const existingPipe = _.find(this.pipes, { sourceUuid: pipeDescriptor.sourceUuid, sinkUuid: pipeDescriptor.sinkUuid });
      if (existingPipe) {
        existingPipe.activate();
        return;
      }
      const pipe = new Pipe(pipeDescriptor.sourceUuid, pipeDescriptor.sinkUuid);
      this.pipes.push(pipe);
      pipe.activate();
    });

    this.pipes.forEach((pipe) => {
      if (!_.some(message.pipes, { sourceUuid: pipe.sourceUuid, sinkUuid: pipe.sinkUuid })) {
        pipe.close();
      }
    });
    this.audioSourcesSinksManager.emit('soundstateUpdated');
  }

  private handlePeerConnectionInfo = async (message: PeerConnectionInfoMessage) => {
    const peer = this.webrtcServer.getPeerByUuid(message.peerUuid);
    if (!(peer instanceof WebrtcPeer)) {
      return;
    }
    if (message.offer) {
      if (peer.connection.signalingState === 'have-local-offer') {
        // we received an offer while waiting for a response, it usually means that the two peers are trying to connect at the same time, it this is the case, ONLY ONE the two peer need to reset its connection and accept the offer. To determine which peer needs to do that, we use the UUID of the remote peer and if it is higher than our own UUID we reset our connection. The remote peer will just ignore the message.
        if (message.peerUuid < getLocalPeer().uuid) {
          return;
        }
        peer.initWebrtc();
      }
      if (peer.connection.signalingState !== 'stable') {
        await peer.connection.setRemoteDescription(message.offer);
        const answer = await peer.connection.createAnswer();
        peer.connection.setLocalDescription(answer);

        this.webrtcServer.coordinatorPeer.sendControllerMessage({
          type: 'peerConnectionInfo',
          peerUuid: peer.uuid,
          offer: peer.connection.localDescription,
        });
      }
    }
    // if (message.iceCandidates) {
    //   for (const iceCandidate of message.iceCandidates) {
    //     // @ts-ignore
    //     await peer.connection.addIceCandidate(new RTCIceCandidate({ candidate: iceCandidate }));
    //   }
    // }
  }

  private handleNewSourceChannel = async ({ sourceUuid, stream }: {sourceUuid: string; stream: NodeJS.WritableStream}) => {
    const source = _.find(this.audioSourcesSinksManager.sources, { uuid: sourceUuid });
    if (!source) {
      this.log(`Trying to request channel to unknown source (uuid ${sourceUuid})`);
      return;
    }
    const sourceStream = await source.start();
    sourceStream.pipe(stream);
  }

  private handleSinkUpdate = (message: SinkInfoMessage) => {
    const sink = this.audioSourcesSinksManager.getSinkByUuid(message.uuid);
    sink.updateInfo({
      name: message.name,
    });
  }

  private handleSourceUpdate = (message: SourceInfoMessage) => {
    const source = this.audioSourcesSinksManager.getSourceByUuid(message.uuid);
    source.updateInfo({
      name: message.name,
      latency: message.latency,
    });
  }
}
