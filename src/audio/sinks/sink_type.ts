import { Peer } from '../../communication/peer';

export interface BaseSinkDescriptor {
  name: string;
  uuid?: string;
  peer?: Peer;
}

export interface RtAudioSinkDescriptor extends BaseSinkDescriptor {
  type: 'rtaudio';
  deviceName: string;
}

export interface RemoteSinkDescriptor extends BaseSinkDescriptor {
  type: 'remote';
  uuid: string;
  channels: number;
}

export type SinkDescriptor = RtAudioSinkDescriptor | RemoteSinkDescriptor;
export type SinkType = SinkDescriptor['type'];
