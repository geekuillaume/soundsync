import debug from 'debug';
import _ from 'lodash';
import uuidv4 from 'uuid/v4';
import { Peer } from '../communication/peer';
import { getAudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { getPeersManager } from '../communication/peers_manager';
import { AudioSource } from '../audio/sources/audio_source';
import {
  PeerConnectionInfoMessage,
  PeerSoundStateMessage,
  SinkInfoMessage,
  SourceInfoMessage,
  PeerDiscoveryMessage,
} from '../communication/messages';
import { WebrtcPeer } from '../communication/wrtc_peer';
// import { waitUntilIceGatheringStateComplete } from '../utils/wait_for_ice_complete';
import { getLocalPeer } from '../communication/local_peer';

export class ClientCoordinator {
  log: debug.Debugger;
  private _alreadyReceivedMessage: string[] = [];

  constructor() {
    this.log = debug(`soundsync:clientCoordinator`);
    this.log(`Created client coordinator`);

    getPeersManager().on('newSourceChannel', this.handleNewSourceChannel);

    getPeersManager()
      .onControllerMessage('peerConnectionInfo', this.handlePeerConnectionInfo)
      .onControllerMessage('peerSoundState', this.handlePeerSoundStateUpdate)
      .onControllerMessage('sinkInfo', this.handleSinkUpdate)
      .onControllerMessage('sourceInfo', this.handleSourceUpdate)
      .onControllerMessage('peerDiscovery', this.handlePeerDiscoveryMessage)
      .on('newConnectedPeer', () => {
        this.announceSoundState();
      });

    getAudioSourcesSinksManager().on('newLocalSink', this.announceSoundState);
    getAudioSourcesSinksManager().on('newLocalSource', this.announceSoundState);
    getAudioSourcesSinksManager().on('sinkUpdate', this.announceSoundState);
    getAudioSourcesSinksManager().on('sourceUpdate', this.announceSoundState);

    // getPeersManager().coordinatorPeer.waitForConnected().then(async () => {
    //   getPeersManager().coordinatorPeer.sendControllerMessage({
    //     type: 'requestSoundState',
    //   });
    // });
  }

  private announceSoundState = () => {
    getPeersManager().broadcast({
      type: 'peerSoundState',
      sinks: getAudioSourcesSinksManager().sinks.filter((s) => s.local).map((sink) => sink.toDescriptor()),
      sources: getAudioSourcesSinksManager().sources.filter((s) => s.local).map((source) => source.toDescriptor()),
    });
  }

  private handlePeerSoundStateUpdate = (message: PeerSoundStateMessage, peer: Peer) => {
    Object.keys(message.sources).forEach((sourceUuid) => {
      const source = message.sources[sourceUuid];
      getAudioSourcesSinksManager().addSource(source);
    });
    Object.keys(message.sinks).forEach((sinkUuid) => {
      const sink = message.sinks[sinkUuid];
      getAudioSourcesSinksManager().addSink(sink);
    });
    getAudioSourcesSinksManager().sources.forEach((source) => {
      if (!_.some(message.sources, { uuid: source.uuid }) && source.peerUuid === peer.uuid) {
        getAudioSourcesSinksManager().removeSource(source.uuid);
      }
    });
    getAudioSourcesSinksManager().sinks.forEach((sink) => {
      if (!_.some(message.sinks, { uuid: sink.uuid }) && sink.peerUuid === peer.uuid) {
        getAudioSourcesSinksManager().removeSink(sink.uuid);
      }
    });
  }

  private handlePeerConnectionInfo = async (message: PeerConnectionInfoMessage, transmitter: Peer) => {
    if (this._alreadyReceivedMessage.includes(message.uuid)) {
      return;
    }
    this._alreadyReceivedMessage.push(message.uuid);
    if (message.peerUuid !== getLocalPeer().uuid) {
      // we received this message but it's not for us, let's retransmit it to the correct peer
      const destinationPeer = getPeersManager().peers[message.peerUuid];
      if (destinationPeer) {
        destinationPeer.sendControllerMessage(message);
      }
      return;
    }
    const requesterPeer = getPeersManager().getPeerByUuid(message.requesterUuid);
    if (!(requesterPeer instanceof WebrtcPeer)) {
      return;
    }

    if (message.offer) {
      if (message.isAnswer) {
        await requesterPeer.connection.setRemoteDescription(message.offer);
        return;
      }
      console.log(1, requesterPeer.connection.signalingState);
      // we received an offer while waiting for a response, it usually means that the two peers are trying to connect at the same time, it this is the case, ONLY ONE the two peer need to reset its connection and accept the offer. To determine which peer needs to do that, we use the UUID of the remote peer and if it is higher than our own UUID we reset our connection. The remote peer will just ignore the message.
      if (requesterPeer.connection.signalingState === 'have-local-offer' && requesterPeer.uuid < getLocalPeer().uuid) {
        return;
      }
      console.log(2, requesterPeer.connection.signalingState);
      requesterPeer.initWebrtc();
      console.log(3, requesterPeer.connection.signalingState);
      await requesterPeer.connection.setRemoteDescription(message.offer);
      console.log(4, requesterPeer.connection.signalingState);
      const answer = await requesterPeer.connection.createAnswer();
      console.log(5, requesterPeer.connection.signalingState);
      requesterPeer.connection.setLocalDescription(answer);
      console.log(6, requesterPeer.connection.signalingState);

      transmitter.sendControllerMessage({
        type: 'peerConnectionInfo',
        peerUuid: requesterPeer.uuid,
        requesterUuid: getLocalPeer().uuid,
        offer: requesterPeer.connection.localDescription,
        isAnswer: true,
        uuid: uuidv4(),
      });
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
    const sink = getAudioSourcesSinksManager().getSinkByUuid(message.sink.uuid);
    sink.updateInfo({
      name: message.sink.name,
    });
  }

  private handleSourceUpdate = (message: SourceInfoMessage) => {
    const source = getAudioSourcesSinksManager().getSourceByUuid(message.source.uuid);
    source.updateInfo({
      name: message.source.name,
      latency: message.source.latency,
    });
  }

  private handlePeerDiscoveryMessage = (message: PeerDiscoveryMessage) => {
    message.peersUuid.forEach((uuid) => {
      getPeersManager().getPeerByUuid(uuid);
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
