export type SourceUUID = string;

export interface BaseSourceDescriptor {
  type;
  name: string;
  uuid?: SourceUUID;
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
  };
}

export interface ShairportSourceDescriptor extends BaseSourceDescriptor {
  type: 'shairport';
  shairportOptions: {
    name?: string;
    password?: string;
    debug?: boolean;
  };
}

export interface NullSourceDescriptor extends BaseSourceDescriptor {
  type: 'null';
}

export interface RtAudioSourceDescriptor extends BaseSourceDescriptor {
  type: 'rtaudio';
  deviceName: string;
}

export type SourceDescriptor = LibresportSourceDescriptor | NullSourceDescriptor | RtAudioSourceDescriptor | ShairportSourceDescriptor;
export type SourceType = SourceDescriptor['type'];
