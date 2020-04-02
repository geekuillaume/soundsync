import debug from 'debug';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { Peer } from '../communication/peer';
import { getAudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { getPeersManager } from '../communication/peers_manager';
import {
  PeerConnectionInfoMessage,
  PeerSoundStateMessage,
  SinkPatchMessage,
  SourcePatchMessage,
  PeerDiscoveryMessage,
  SourceCreateMessage,
  SourceDeleteMessage,
} from '../communication/messages';
import { WebrtcPeer } from '../communication/wrtc_peer';
// import { waitUntilIceGatheringStateComplete } from '../utils/wait_for_ice_complete';
import { getLocalPeer } from '../communication/local_peer';

export class ClientCoordinator {
  log: debug.Debugger;

  constructor() {
    this.log = debug(`soundsync:clientCoordinator`);
    this.log(`Created client coordinator`);

    getPeersManager().on('newSourceChannel', this.handleNewSourceChannel);

    getPeersManager()
      .onControllerMessage('peerConnectionInfo', this.handlePeerConnectionInfo)
      .onControllerMessage('peerSoundState', this.handlePeerSoundStateUpdate)
      .onControllerMessage('sinkPatch', this.handleSinkUpdate)
      .onControllerMessage('sourcePatch', this.handleSourceUpdate)
      .onControllerMessage('peerDiscovery', this.handlePeerDiscoveryMessage)
      .onControllerMessage('sourceCreate', this.handleSourceCreate)
      .onControllerMessage('sourceDelete', this.handleSourceDelete)
      .on('newConnectedPeer', () => {
        this.announceSoundState();
      });

    getAudioSourcesSinksManager().on('localSoundStateUpdated', this.announceSoundState);
  }

  private announceSoundState = () => {
    getPeersManager().broadcast({
      type: 'peerSoundState',
      sinks: getAudioSourcesSinksManager().sinks.filter((s) => s.local).map((sink) => sink.toDescriptor()),
      sources: getAudioSourcesSinksManager().sources.filter((s) => s.local).map((source) => source.toDescriptor()),
    });
  }

  private handlePeerSoundStateUpdate = (message: PeerSoundStateMessage, peer: Peer) => {
    if (peer === getLocalPeer()) {
      return;
    }
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
    if (message.targetUuid !== getLocalPeer().uuid) {
      // we received this message but it's not for us, let's retransmit it to the correct peer
      const destinationPeer = getPeersManager().peers[message.targetUuid];
      if (destinationPeer) {
        destinationPeer.sendControllerMessage(message);
      }
      return;
    }

    let requesterPeer = getPeersManager().getPeerByUuid(message.senderUuid) as WebrtcPeer;
    if (!(requesterPeer instanceof WebrtcPeer)) {
      return;
    }
    if (!requesterPeer.instanceUuid) {
      requesterPeer.instanceUuid = message.senderInstanceUuid;
    }
    // this is coming from a new peer with the same uuid, disconnect previous
    if (requesterPeer.instanceUuid !== message.senderInstanceUuid) {
      requesterPeer.disconnect(true);
    }
    requesterPeer = new WebrtcPeer({
      uuid: message.senderUuid,
      instanceUuid: message.senderInstanceUuid,
      name: 'placeholder',
      host: 'placeholder',
    });

    getPeersManager().peers[message.senderUuid] = requesterPeer;

    const responseDescription = await requesterPeer.handlePeerConnectionMessage({ description: message.description, candidate: message.candidate });
    if (responseDescription) {
      transmitter.sendControllerMessage({
        type: 'peerConnectionInfo',
        targetUuid: requesterPeer.uuid,
        senderUuid: getLocalPeer().uuid,
        senderInstanceUuid: getLocalPeer().instanceUuid,
        description: responseDescription,
      });
    }
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

  private handleSinkUpdate = (message: SinkPatchMessage) => {
    const sink = getAudioSourcesSinksManager().getSinkByUuid(message.sink.uuid);
    if (!sink) {
      this.log('Trying to update non existing souce');
      return;
    }
    if (!sink.local) {
      this.log('Trying to update remote source with a patch, ignoring');
      return;
    }
    sink.updateInfo(message.sink);
  }

  private handleSourceUpdate = (message: SourcePatchMessage) => {
    const source = getAudioSourcesSinksManager().getSourceByUuid(message.source.uuid);
    if (!source) {
      this.log('Trying to update non existing souce');
      return;
    }
    if (!source.local) {
      this.log('Trying to update remote source with a patch, ignoring');
      return;
    }
    source.updateInfo(message.source);
  }

  private handlePeerDiscoveryMessage = (message: PeerDiscoveryMessage) => {
    message.peersUuid.forEach((uuid) => {
      getPeersManager().getPeerByUuid(uuid);
    });
  }

  private handleSourceCreate = (message: SourceCreateMessage) => {
    getAudioSourcesSinksManager().addSource(message.source);
  }

  private handleSourceDelete = (message: SourceDeleteMessage) => {
    getAudioSourcesSinksManager().removeSource(message.sourceUuid);
  }
}


let clientCoordinator: ClientCoordinator;
export const getClientCoordinator = () => {
  if (!clientCoordinator) {
    clientCoordinator = new ClientCoordinator();
  }
  return clientCoordinator;
};
