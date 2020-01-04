
export interface BaseSinkDescriptor {
  name: string;
  uuid?: string;
}

export interface LocalSinkDescriptor extends BaseSinkDescriptor {
  type: 'defaultPhysicalSink';
}

export type SinkDescriptor = LocalSinkDescriptor;
export type SinkType = SinkDescriptor['type'];
