import debug from 'debug';
import _ from 'lodash';
import { getAudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { getWebrtcServer } from '../communication/wrtc_server';
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
  log: debug.Debugger;
  pipes: Pipe[] = [];

  constructor() {
    this.log = debug(`soundsync:clientCoordinator`);
    this.log(`Created client coordinator`);

    getWebrtcServer().on('newSourceChannel', this.handleNewSourceChannel);

    getWebrtcServer().coordinatorPeer
      .onControllerMessage('peerConnectionInfo', this.handlePeerConnectionInfo)
      .onControllerMessage('soundState', this.handleSoundStateUpdate)
      .onControllerMessage('sinkInfo', this.handleSinkUpdate)
      .onControllerMessage('sourceInfo', this.handleSourceUpdate);

    getWebrtcServer().coordinatorPeer.waitForConnected().then(async () => {
      getWebrtcServer().coordinatorPeer.sendControllerMessage({
        type: 'requestSoundState',
      });
      this.announceAllSourcesSinksToController();
      getAudioSourcesSinksManager().on('newLocalSink', this.announceSinkToController);
      getAudioSourcesSinksManager().on('newLocalSource', this.announceSourceToController);
      getAudioSourcesSinksManager().on('sinkUpdate', this.announceSinkToController);
      getAudioSourcesSinksManager().on('sourceUpdate', this.announceSourceToController);
    });
  }

  private announceAllSourcesSinksToController = () => {
    getAudioSourcesSinksManager().sinks.forEach(this.announceSinkToController);
    getAudioSourcesSinksManager().sources.forEach(this.announceSourceToController);
  }

  private announceSinkToController = (sink: AudioSink) => {
    if (!sink.local) {
      return;
    }
    getWebrtcServer().coordinatorPeer.sendControllerMessage({
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
    getWebrtcServer().coordinatorPeer.sendControllerMessage({
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
      getAudioSourcesSinksManager().addSource(source);
    });
    Object.keys(message.sinks).forEach((sinkUuid) => {
      const sink = message.sinks[sinkUuid];
      getAudioSourcesSinksManager().addSink(sink);
    });
    getAudioSourcesSinksManager().sources.forEach((source) => {
      if (!_.some(message.sources, { uuid: source.uuid }) && !source.local) {
        getAudioSourcesSinksManager().removeSource(source.uuid);
      }
    });
    getAudioSourcesSinksManager().sinks.forEach((sink) => {
      if (!_.some(message.sinks, { uuid: sink.uuid }) && !sink.local) {
        getAudioSourcesSinksManager().removeSink(sink.uuid);
      }
    });

    message.pipes.forEach(this.addPipe);

    this.pipes.forEach((pipe) => {
      if (!_.some(message.pipes, { sourceUuid: pipe.sourceUuid, sinkUuid: pipe.sinkUuid })) {
        pipe.close();
      }
    });
  }

  addPipe = (pipeDescriptor) => {
    const existingPipe = _.find(this.pipes, { sourceUuid: pipeDescriptor.sourceUuid, sinkUuid: pipeDescriptor.sinkUuid });
    if (existingPipe) {
      existingPipe.activate();
      return;
    }
    const pipe = new Pipe(pipeDescriptor.sourceUuid, pipeDescriptor.sinkUuid);
    this.pipes.push(pipe);
    pipe.activate();
  }

  private handlePeerConnectionInfo = async (message: PeerConnectionInfoMessage) => {
    const peer = getWebrtcServer().getPeerByUuid(message.peerUuid);
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

        getWebrtcServer().coordinatorPeer.sendControllerMessage({
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
    const source = _.find(getAudioSourcesSinksManager().sources, { uuid: sourceUuid });
    if (!source) {
      this.log(`Trying to request channel to unknown source (uuid ${sourceUuid})`);
      return;
    }
    const sourceStream = await source.start();
    sourceStream.pipe(stream);
  }

  private handleSinkUpdate = (message: SinkInfoMessage) => {
    const sink = getAudioSourcesSinksManager().getSinkByUuid(message.uuid);
    sink.updateInfo({
      name: message.name,
    });
  }

  private handleSourceUpdate = (message: SourceInfoMessage) => {
    const source = getAudioSourcesSinksManager().getSourceByUuid(message.uuid);
    source.updateInfo({
      name: message.name,
      latency: message.latency,
    });
  }
}


let clientCoordinator: ClientCoordinator;
export const getClientCoordinator = () => {
  if (!clientCoordinator) {
    clientCoordinator = new ClientCoordinator();
  }
  return clientCoordinator;
};
