import debug from 'debug';
import _ from 'lodash';
import { getAudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { getPeersManager } from '../communication/peers_manager';
import {
  SourceInfoMessage, SinkInfoMessage, SoundStateMessage,
} from '../communication/messages';
import { WebrtcPeer } from '../communication/wrtc_peer';
import { attachTimekeeperCoordinator } from './timekeeper';

const l = debug(`soundsync:hostCoordinator`);

const getSoundStateMessage = (): SoundStateMessage => ({
  type: 'soundState',
  sinks: getAudioSourcesSinksManager().sinks.map((sink) => sink.toDescriptor()),
  sources: getAudioSourcesSinksManager().sources.map((source) => source.toDescriptor()),
});

const broadcastState = async () => getPeersManager().broadcast(getSoundStateMessage());
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
  const webrtcServer = getPeersManager();

  webrtcServer.on(`peerControllerMessage:sourceInfo`, ({ peer, message }: {peer: WebrtcPeer; message: SourceInfoMessage}) => {
    handleSourceInfo(peer, message);
  });
  webrtcServer.on(`peerControllerMessage:sinkInfo`, ({ peer, message }: {peer: WebrtcPeer; message: SinkInfoMessage}) => {
    handleSinkInfo(peer, message);
  });
  webrtcServer.on(`peerControllerMessage:requestSoundState`, ({ peer }: {peer: WebrtcPeer}) => {
    handleRequestSourceList(peer);
  });

  attachTimekeeperCoordinator(webrtcServer);
};
