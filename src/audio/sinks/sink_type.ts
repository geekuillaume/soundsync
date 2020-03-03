import { SourceUUID } from '../sources/source_type';

export type SinkUUID = string;

export interface BaseSinkDescriptor {
  type;
  name: string;
  uuid?: SinkUUID;
  peerUuid: string;
  latency?: number;
  pipedFrom?: SourceUUID;
}

export interface RtAudioSinkDescriptor extends BaseSinkDescriptor {
  type: 'rtaudio';
  deviceName?: string; // Use default device if not set
}

export interface NullSinkDescriptor extends BaseSinkDescriptor {
  type: 'null';
}

export interface WebAudioSinkDescriptor extends BaseSinkDescriptor {
  type: 'webaudio';
}

export type SinkDescriptor = RtAudioSinkDescriptor | NullSinkDescriptor | WebAudioSinkDescriptor;
export type SinkType = SinkDescriptor['type'];
