import { onHueScanRPC, onHueGetEntertainmentZones } from './huelights';
import { onCreateSink } from './createSink';

export const rpcHandlers = {
  hueScan: onHueScanRPC,
  hueGetEntertainmentZones: onHueGetEntertainmentZones,
  createSink: onCreateSink,
};

export type RPCType = keyof typeof rpcHandlers;

export type RPCHandlerOfType<T extends RPCType> = typeof rpcHandlers[T];
export type RPCRequestBody<T extends RPCType> = Parameters<RPCHandlerOfType<T>>[1];
export type RPCResponseBody<T extends RPCType> = Unpromise<ReturnType<RPCHandlerOfType<T>>>;

type Unpromise<T> = T extends Promise<infer U> ? U : any;
