export interface BaseSinkDescriptor {
  type;
  name: string;
  uuid?: string;
  peerUuid: string;
  latency?: number;
}

// used only in messages to prevent an update targeting an old instances of sink
export interface BaseSinkInstanceDescriptor extends BaseSinkDescriptor {
  instanceUuid: string;
}

export interface RtAudioSinkDescriptor extends BaseSinkDescriptor {
  type: 'rtaudio';
  deviceName?: string; // Use default device if not set
}

export interface NullSinkDescriptor extends BaseSinkDescriptor {
  type: 'null';
}

export interface WebAudioSinkDescriptor extends BaseSinkDescriptor {
  type: 'webaudio';
}

export type SinkDescriptor = RtAudioSinkDescriptor | NullSinkDescriptor | WebAudioSinkDescriptor;
export type SinkInstanceDescriptor = SinkDescriptor & BaseSinkInstanceDescriptor;
export type SinkType = SinkDescriptor['type'];
