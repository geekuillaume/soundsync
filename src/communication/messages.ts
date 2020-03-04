import { Peer } from './peer';
import {
  BaseSourceDescriptor,
} from '../audio/sources/source_type';
import { BaseSinkDescriptor } from '../audio/sinks/sink_type';
import { WebrtcPeer } from './wrtc_peer';
import { AudioInstance } from '../audio/utils';

export interface BaseMessage {
  type;
}

export interface LightMessage extends BaseMessage {
  type: 'ping' | 'pong' | 'requestSoundState' | 'disconnect';
}

export interface SourcePatchMessage extends BaseMessage {
  type: 'sourcePatch';
  source: Partial<AudioInstance<BaseSourceDescriptor>>;
}

export interface SinkPatchMessage extends BaseMessage {
  type: 'sinkPatch';
  sink: Partial<AudioInstance<BaseSinkDescriptor>>;
}

export interface PeerConnectionInfoMessage extends BaseMessage {
  type: 'peerConnectionInfo';
  peerUuid: string;
  requesterUuid: string;
  offer?: string;
  iceCandidates?: string[];
  isAnswer: boolean;
  uuid: string;
}

export interface TimekeepRequest extends BaseMessage {
  type: 'timekeepRequest';
  sentAt: number;
}

export interface TimekeepResponse extends BaseMessage {
  type: 'timekeepResponse';
  sentAt: number;
  respondedAt: number;
}

export interface PeerSoundStateMessage extends BaseMessage {
  type: 'peerSoundState';
  sources: AudioInstance<BaseSourceDescriptor>[];
  sinks: AudioInstance<BaseSinkDescriptor>[];
}

export interface PeerDiscoveryMessage extends BaseMessage {
  type: 'peerDiscovery';
  peersUuid: string[];
}

export type ControllerMessage =
  LightMessage |
  SourcePatchMessage |
  SinkPatchMessage |
  PeerConnectionInfoMessage |
  TimekeepRequest | TimekeepResponse |
  PeerDiscoveryMessage |
  PeerSoundStateMessage;

export type ControllerMessageHandler<T> =
  ((type: LightMessage['type'], handler: (message: LightMessage, peer: Peer) => any) => T) &
  ((type: SourcePatchMessage['type'], handler: (message: SourcePatchMessage, peer: Peer) => any) => T) &
  ((type: SinkPatchMessage['type'], handler: (message: SinkPatchMessage, peer: Peer) => any) => T) &
  ((type: PeerConnectionInfoMessage['type'], handler: (message: PeerConnectionInfoMessage, peer: Peer) => any) => T) &
  ((type: TimekeepRequest['type'], handler: (message: TimekeepRequest, peer: Peer) => any) => T) &
  ((type: TimekeepResponse['type'], handler: (message: TimekeepResponse, peer: Peer) => any) => T) &
  ((type: PeerDiscoveryMessage['type'], handler: (message: PeerDiscoveryMessage, peer: Peer) => any) => T) &
  ((type: PeerSoundStateMessage['type'], handler: (message: PeerSoundStateMessage, peer: Peer) => any) => T);
