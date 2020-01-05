import { SourceType } from '../audio/source_type';
import { SinkType } from '../audio/sink_type';

export interface LightMessage {
  type: 'ping' | 'pong' | 'requestSourcesList';
}

export interface AddLocalSourceMessage {
  type: 'addLocalSource'; // send from client to host coordinator when a client source changes
  sourceType: SourceType;
  name: string;
  uuid: string;
  channels: number;
}

export interface AddRemoteSourceMessage {
  type: 'addRemoteSource'; // send from coordinator host to clients when a remote source changes
  sourceType: SourceType;
  name: string;
  uuid: string;
  channels: number;
  peerUuid: string;
}

export interface AddSinkMessage {
  type: 'addLocalSink';
  sinkType: SinkType;
  name: string;
  uuid: string;
  channels: number;
}

// TODO: implement sink removal messages and handling

export interface RemoveSourceMessage {
  type: 'removeRemoteSource' | 'removeLocalSource';
  uuid: string;
}

export interface CreatePipeMessage {
  type: 'createPipe';
  sourceUuid: string;
  sinkUuid: string;
}

export interface PeerConnectionInfoMessage {
  type: 'peerConnectionInfo';
  peerUuid: string;
  offer?: string;
  iceCandidates?: string[];
}

export type ControllerMessage =
  LightMessage |
  AddRemoteSourceMessage |
  AddLocalSourceMessage |
  RemoveSourceMessage |
  AddSinkMessage |
  CreatePipeMessage |
  PeerConnectionInfoMessage;
