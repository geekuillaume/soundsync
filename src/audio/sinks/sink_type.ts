import { Peer } from '../../communication/peer';

export interface BaseSinkDescriptor {
  type;
  name: string;
  uuid?: string;
  peer?: Peer;
}

export interface RtAudioSinkDescriptor extends BaseSinkDescriptor {
  type: 'rtaudio';
  deviceName?: string; // Use default device if not set
}

export interface RemoteSinkDescriptor extends BaseSinkDescriptor {
  type: 'remote';
  uuid: string;
  channels: number;
}

export interface NullSinkDescriptor extends BaseSinkDescriptor {
  type: 'null';
}

export type LocalSinkDescriptor = RtAudioSinkDescriptor | NullSinkDescriptor;
export type SinkDescriptor = LocalSinkDescriptor | RemoteSinkDescriptor;
export type SinkType = SinkDescriptor['type'];
