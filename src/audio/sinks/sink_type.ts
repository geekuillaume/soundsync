export interface BaseSinkDescriptor {
  type;
  name: string;
  uuid?: string;
  peerUuid: string;
  latency?: number;
}

export interface RtAudioSinkDescriptor extends BaseSinkDescriptor {
  type: 'rtaudio';
  deviceName?: string; // Use default device if not set
}

export interface NullSinkDescriptor extends BaseSinkDescriptor {
  type: 'null';
}

export type SinkDescriptor = RtAudioSinkDescriptor | NullSinkDescriptor;
export type SinkType = SinkDescriptor['type'];
