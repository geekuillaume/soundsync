import { Peer } from '../communication/peer';

export interface BaseSinkDescriptor {
  name: string;
  uuid?: string;
  peer?: Peer;
}

export interface LocalSinkDescriptor extends BaseSinkDescriptor {
  type: 'defaultPhysical';
}

export interface RemoteSinkDescriptor extends BaseSinkDescriptor {
  type: 'remote';
  uuid: string;
  channels: number;
}

export type SinkDescriptor = LocalSinkDescriptor | RemoteSinkDescriptor;
export type SinkType = SinkDescriptor['type'];
