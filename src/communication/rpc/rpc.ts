import { onHueScanRPC } from './huelights';

export const rpcHandlers = {
  hueScan: onHueScanRPC,
};

export type RPCType = keyof typeof rpcHandlers;

export type RPCHandlerOfType<T extends RPCType> = typeof rpcHandlers[T];
export type RPCRequestBody<T extends RPCType> = Parameters<RPCHandlerOfType<T>>[1];
export type RPCResponseBody<T extends RPCType> = Unpromise<ReturnType<RPCHandlerOfType<T>>>;

type Unpromise<T> = T extends Promise<infer U> ? U : any;
