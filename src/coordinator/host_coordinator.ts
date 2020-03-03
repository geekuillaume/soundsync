import debug from 'debug';
import _ from 'lodash';
import { getAudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { getWebrtcServer } from '../communication/wrtc_server';
import {
  SourceInfoMessage, SinkInfoMessage, PeerConnectionInfoMessage, SoundStateMessage,
} from '../communication/messages';
import { WebrtcPeer } from '../communication/wrtc_peer';
import { attachTimekeeperCoordinator } from './timekeeper';
import { AudioInstance } from '../audio/utils';
import { BaseSourceDescriptor } from '../audio/sources/source_type';
import { BaseSinkDescriptor } from '../audio/sinks/sink_type';

const l = debug(`soundsync:hostCoordinator`);

const getSoundStateMessage = (): SoundStateMessage => ({
  type: 'soundState',
  sinks: getAudioSourcesSinksManager().sinks.map((sink) => sink.toDescriptor()),
  sources: getAudioSourcesSinksManager().sources.map((source) => source.toDescriptor()),
});

const broadcastState = async () => getWebrtcServer().broadcast(getSoundStateMessage());
const handleRequestSourceList = (peer: WebrtcPeer) => peer.sendControllerMessage(getSoundStateMessage());

const handleSourceInfo = async (peer: WebrtcPeer, message: SourceInfoMessage) => {
  getAudioSourcesSinksManager().addSource(message.source);
  broadcastState();
};

const handleSinkInfo = (peer: WebrtcPeer, message: SinkInfoMessage) => {
  getAudioSourcesSinksManager().addSink(message.sink);
  broadcastState();
  // TODO: handle disconnect of peer
};

const handlePeerConnectionInfo = (peer: WebrtcPeer, message: PeerConnectionInfoMessage) => {
  const targetPeer = getWebrtcServer().peers[message.peerUuid];
  if (!targetPeer) {
    l(`Tried to pass PeerConnectionInfo message to unknown peer ${message.peerUuid}`);
    return;
  }
  targetPeer.sendControllerMessage({
    type: 'peerConnectionInfo',
    peerUuid: peer.uuid,
    offer: message.offer,
    iceCandidates: message.iceCandidates,
  });
};

// private handleSinkLatencyUpdate = (peer: WebrtcPeer, message: SinkLatencyUpdateMessage) => {
//   const pipes = this.pipes.filter((p) => p.sink && p.sink.uuid === message.sinkUuid);
//   pipes.forEach((p) => {
//     p.latency = message.latency;
//     p.source.updateInfo({
//       latency: Math.max(...pipes.filter(({source}) => source === p.source).map(({latency}) => latency)) + FORCED_STREAM_LATENCY,
//     })
//   });
// }

export const attachHostCoordinator = () => {
  l(`Created host coordinator`);
  const webrtcServer = getWebrtcServer();

  webrtcServer.on(`peerControllerMessage:sourceInfo`, ({ peer, message }: {peer: WebrtcPeer; message: SourceInfoMessage}) => {
    handleSourceInfo(peer, message);
  });
  webrtcServer.on(`peerControllerMessage:sinkInfo`, ({ peer, message }: {peer: WebrtcPeer; message: SinkInfoMessage}) => {
    handleSinkInfo(peer, message);
  });
  webrtcServer.on(`peerControllerMessage:requestSoundState`, ({ peer }: {peer: WebrtcPeer}) => {
    handleRequestSourceList(peer);
  });
  webrtcServer.on(`peerControllerMessage:peerConnectionInfo`, ({ peer, message }: {peer: WebrtcPeer; message: PeerConnectionInfoMessage}) => {
    handlePeerConnectionInfo(peer, message);
  });

  attachTimekeeperCoordinator(webrtcServer);
};
