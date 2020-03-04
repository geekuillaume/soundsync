import { Peer } from './peer';
import {
  BaseSourceDescriptor,
} from '../audio/sources/source_type';
import { BaseSinkDescriptor } from '../audio/sinks/sink_type';
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

export interface PeerInfoMessage extends BaseMessage {
  type: 'peerInfo';
  name: string;
}

export type ControllerMessage =
  LightMessage |
  SourcePatchMessage |
  SinkPatchMessage |
  PeerConnectionInfoMessage |
  TimekeepRequest | TimekeepResponse |
  PeerDiscoveryMessage |
  PeerInfoMessage |
  PeerSoundStateMessage;

type ControllerMessageSingleHandler<T extends BaseMessage, Y> = ((type: T['type'], handler: (message: T, peer: Peer) => any) => Y);

export type ControllerMessageHandler<T> =
  ControllerMessageSingleHandler<LightMessage, T> &
  ControllerMessageSingleHandler<SourcePatchMessage, T> &
  ControllerMessageSingleHandler<SinkPatchMessage, T> &
  ControllerMessageSingleHandler<PeerConnectionInfoMessage, T> &
  ControllerMessageSingleHandler<TimekeepRequest, T> &
  ControllerMessageSingleHandler<TimekeepResponse, T> &
  ControllerMessageSingleHandler<PeerDiscoveryMessage, T> &
  ControllerMessageSingleHandler<PeerInfoMessage, T> &
  ControllerMessageSingleHandler<PeerSoundStateMessage, T>;
