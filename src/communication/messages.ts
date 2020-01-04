import { SourceType } from '../audio/source_type';
import { SinkType } from '../audio/sink_type';

export interface LightMessage {
  type: 'ping' | 'pong' | 'requestSourcesList';
}

export interface AddSourceMessage {
  type: 'addRemoteSource' // send from coordinator host to clients when a remote source changes
    | 'addLocalSource'; // send from client to host coordinator when a client source changes
  sourceType: SourceType;
  name: string;
  uuid: string;
  channels: number;
}

export interface AddSinkMessage {
  type: 'addLocalSink';
  sinkType: SinkType;
  name: string;
  uuid: string;
  channels: number;
}

export interface RemoveSourceMessage {
  type: 'removeRemoteSource' | 'removeLocalSource';
  uuid: string;
}

export type ControllerMessage = LightMessage | AddSourceMessage | RemoveSourceMessage | AddSinkMessage;
