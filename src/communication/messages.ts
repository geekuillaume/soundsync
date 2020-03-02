import { SourceType, SourceDescriptor } from '../audio/sources/source_type';
import { SinkType, SinkDescriptor } from '../audio/sinks/sink_type';
import { WebrtcPeer } from './wrtc_peer';
import { PipeDescriptor } from '../coordinator/pipe';

export interface BaseMessage {
  type;
}

export interface LightMessage extends BaseMessage {
  type: 'ping' | 'pong' | 'requestSoundState' | 'disconnect';
}

export interface SourceInfoMessage extends BaseMessage {
  type: 'sourceInfo'; // send from client to host coordinator when a client source changes
  sourceType: SourceType;
  name: string;
  uuid: string;
  channels: number;
  latency: number;
  startedAt: number;
  peerUuid: string;
  instanceUuid: string;
}

export interface SinkInfoMessage extends BaseMessage {
  type: 'sinkInfo';
  sinkType: SinkType;
  name: string;
  uuid: string;
  channels: number;
  latency: number;
  instanceUuid: string;
}

// TODO: implement sink removal messages and handling

export interface RemoveSourceMessage extends BaseMessage {
  type: 'removeSource';
  uuid: string;
}

export interface PeerConnectionInfoMessage extends BaseMessage {
  type: 'peerConnectionInfo';
  peerUuid: string;
  offer?: string;
  iceCandidates?: string[];
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

export interface SoundStateMessage extends BaseMessage {
  type: 'soundState';
  sources: SourceDescriptor[];
  sinks: SinkDescriptor[];
  pipes: PipeDescriptor[];
}

export type ControllerMessage =
  LightMessage |
  SourceInfoMessage |
  RemoveSourceMessage |
  SinkInfoMessage |
  PeerConnectionInfoMessage |
  TimekeepRequest | TimekeepResponse |
  SoundStateMessage;

export type Handler<T extends BaseMessage> = ({ message, peer }: {message: T; peer: WebrtcPeer}) => any;
