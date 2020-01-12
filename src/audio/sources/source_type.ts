import { Peer } from '../../communication/peer';

export interface BaseSourceDescriptor {
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

export type SourceDescriptor = LibresportSourceDescriptor | RemoteSourceDescriptor;
export type SourceType = SourceDescriptor['type'];
