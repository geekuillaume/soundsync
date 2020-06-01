import { SourceUUID } from '../sources/source_type';

export type SinkUUID = string;

export interface BaseSinkDescriptor {
  type;
  name: string;
  uuid: SinkUUID;
  peerUuid: string;
  latency?: number;
  pipedFrom: SourceUUID | null;
  available: boolean;
  volume: number;
}

export interface LocalDeviceSinkDescriptor extends BaseSinkDescriptor {
  type: 'localdevice';
  deviceId: string;
}

export interface NullSinkDescriptor extends BaseSinkDescriptor {
  type: 'null';
}

export interface WebAudioSinkDescriptor extends BaseSinkDescriptor {
  type: 'webaudio';
}

export type SinkDescriptor = LocalDeviceSinkDescriptor | NullSinkDescriptor | WebAudioSinkDescriptor;
export type SinkType = SinkDescriptor['type'];
