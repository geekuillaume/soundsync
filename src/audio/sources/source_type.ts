export interface BaseSourceDescriptor {
  type;
  name: string;
  uuid?: string;
  peerUuid: string;
  startedAt?: number;
  latency?: number;
  channels?: number;
}

export interface LibresportSourceDescriptor extends BaseSourceDescriptor {
  type: 'librespot';
  librespotOptions: {
    name?: string;
    bitrate?: 96 | 16 | 320;
    username?: string;
    password?: string;
  }
}

export interface NullSourceDescriptor extends BaseSourceDescriptor {
  type: 'null';
}

export type SourceDescriptor = LibresportSourceDescriptor | NullSourceDescriptor;
export type SourceType = SourceDescriptor['type'];
