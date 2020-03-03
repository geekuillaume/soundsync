import {
  SourceUUID, BaseSourceDescriptor,
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

export interface SourceInfoMessage extends BaseMessage {
  type: 'sourceInfo'; // send from client to host coordinator when a client source changes
  source: AudioInstance<BaseSourceDescriptor>;
}

export interface SinkInfoMessage extends BaseMessage {
  type: 'sinkInfo';
  sink: AudioInstance<BaseSinkDescriptor>;
}

// TODO: implement sink removal messages and handling

export interface RemoveSourceMessage extends BaseMessage {
  type: 'removeSource';
  uuid: SourceUUID;
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
  sources: AudioInstance<BaseSourceDescriptor>[];
  sinks: AudioInstance<BaseSinkDescriptor>[];
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
