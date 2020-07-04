export type SourceUUID = string;

export interface BaseSourceDescriptor {
  type;
  name: string;
  uuid: SourceUUID;
  peerUuid: string;
  startedAt?: number;
  latency?: number;
  channels?: number;
  available: boolean;
  active: boolean;
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

export interface LocalDeviceSourceDescriptor extends BaseSourceDescriptor {
  type: 'localdevice';
  deviceId: string;
}

export type SourceDescriptor = LibresportSourceDescriptor | NullSourceDescriptor | LocalDeviceSourceDescriptor | ShairportSourceDescriptor;
export type SourceType = SourceDescriptor['type'];
