import { SourceUUID } from '../sources/source_type';

export type SinkUUID = string;

export interface BaseSinkDescriptor {
  type;
  name: string;
  uuid: SinkUUID;
  peerUuid: string;
  latency?: number;
  latencyCorrection?: number;
  error?: string;
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

export enum HueLightStatus {
  notConnectable = 'notConnectable', // host is not joinable
  connecting = 'connecting', // authentifying to hue bridge
  needsAuthorization = 'needsAuthorization', // need to start authorization process
  needAuthorizationValidation = 'needAuthorizationValidation', // needs to push the hue bridge button to authorize
  available = 'available', // connected and authentified
  initializingStreaming = 'initializingStreaming', // starting dtls socket
  initializingError = 'initializingError', // error while starting dtls socket
}

export interface HueLightSinkDescriptor extends BaseSinkDescriptor {
  type: 'huelight';
  hueHost: string;
  entertainmentZoneId: string;
  status: HueLightStatus;
}

export interface AirplaySinkDescriptor extends BaseSinkDescriptor {
  type: 'airplay';
  host: string;
  port: number;
}

export type SinkDescriptor = LocalDeviceSinkDescriptor | NullSinkDescriptor | WebAudioSinkDescriptor | HueLightSinkDescriptor | AirplaySinkDescriptor;
export type SinkType = SinkDescriptor['type'];
