import debug from 'debug';
import _ from 'lodash';
import { Peer } from '../communication/peer';
import { getAudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { getPeersManager } from '../communication/get_peers_manager';
import {
  PeerConnectionInfoMessage,
  PeerSoundStateMessage,
  SinkPatchMessage,
  SourcePatchMessage,
  PeerDiscoveryMessage,
  SourceCreateMessage,
  SourceDeleteMessage,
} from '../communication/messages';
import { handlePeerRelayInitiatorMessage } from '../communication/initiators/peerRelayInitiator';
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
      .on('newConnectedPeer', (peer: Peer) => {
        this.announceSoundState(peer);
      });

    getAudioSourcesSinksManager().on('localSoundStateUpdated', this.announceSoundState);
  }

  private announceSoundState = (peer?: Peer) => {
    const message = {
      type: 'peerSoundState',
      sinks: getAudioSourcesSinksManager().sinks.filter((s) => s.local).map((sink) => sink.toDescriptor()),
      sources: getAudioSourcesSinksManager().sources.filter((s) => s.local).map((source) => source.toDescriptor()),
    } as PeerSoundStateMessage;
    if (peer) {
      peer.sendControllerMessage(message);
    } else {
      getPeersManager().broadcast(message);
    }
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

  private handlePeerConnectionInfo = async (message: PeerConnectionInfoMessage) => {
    if (message.targetUuid !== getLocalPeer().uuid) {
      // we received this message but it's not for us, let's retransmit it to the correct peer
      const destinationPeer = getPeersManager().getConnectedPeerByUuid(message.targetUuid);
      if (destinationPeer) {
        destinationPeer.sendControllerMessage(message);
      }
      return;
    }
    await handlePeerRelayInitiatorMessage(message);
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
      getPeersManager().joinPeerWithPeerRelay(uuid);
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
