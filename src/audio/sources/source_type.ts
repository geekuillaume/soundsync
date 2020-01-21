import { Peer } from '../../communication/peer';

export interface BaseSourceDescriptor {
  type;
  name: string;
  uuid?: string;
  peer?: Peer;
  startedAt?: number;
  latency?: number;
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

export interface RemoteSourceDescriptor extends BaseSourceDescriptor {
  type: 'remote';
  uuid: string;
  channels: number;
}

export interface NullSourceDescriptor extends BaseSourceDescriptor {
  type: 'null';
}

export type LocalSourceDescriptor = LibresportSourceDescriptor | NullSourceDescriptor;
export type SourceDescriptor = LocalSourceDescriptor | RemoteSourceDescriptor;
export type SourceType = SourceDescriptor['type'];
