export interface BaseSourceDescriptor {
  type;
  name: string;
  uuid?: string;
  peerUuid: string;
  startedAt?: number;
  latency?: number;
  channels?: number;
}

// used only in messages to prevent an update targeting an old instances of source
export interface BaseSourceInstanceDescriptor extends BaseSourceDescriptor {
  instanceUuid: string;
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

export interface NullSourceDescriptor extends BaseSourceDescriptor {
  type: 'null';
}

export interface RtAudioSourceDescriptor extends BaseSourceDescriptor {
  type: 'rtaudio';
  deviceName: string;
}

export type SourceDescriptor = LibresportSourceDescriptor | NullSourceDescriptor | RtAudioSourceDescriptor;
export type SourceInstanceDescriptor = SourceDescriptor & BaseSourceInstanceDescriptor;
export type SourceType = SourceDescriptor['type'];
