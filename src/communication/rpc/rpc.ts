/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import { onStartChromecast } from './startChromecast';
import { onHueScanRPC, onHueGetEntertainmentZones } from './huelights';
import { onCreateSink } from './createSink';
import { onScanChromecast } from './scanChromecast';

// the lazy loading is mainly used for the WebUI
const lazyLoader = (moduleGetter: () => any, accessor?: (module: any) => any) => {
  let module = null;
  return async (...args) => {
    if (!module) {
      module = await moduleGetter();
      if (accessor) {
        module = accessor(module);
      }
    }
    return module(...args);
  };
};

export const rpcHandlers = {
  hueScan: lazyLoader(() => import('./huelights'), (m) => m.onHueScanRPC) as typeof onHueScanRPC,
  hueGetEntertainmentZones: lazyLoader(() => import('./huelights'), (m) => m.onHueGetEntertainmentZones) as typeof onHueGetEntertainmentZones,
  createSink: onCreateSink,
  scanChromecast: lazyLoader(() => import(/* webpackChunkName: "chromecast" */ './scanChromecast'), (m) => m.onScanChromecast) as typeof onScanChromecast,
  startChromecast: lazyLoader(() => import(/* webpackChunkName: "chromecast" */ './startChromecast'), (m) => m.onStartChromecast) as typeof onStartChromecast,
};

export type RPCType = keyof typeof rpcHandlers;

export type RPCHandlerOfType<T extends RPCType> = typeof rpcHandlers[T];
export type RPCRequestBody<T extends RPCType> = Parameters<RPCHandlerOfType<T>>[1];
export type RPCResponseBody<T extends RPCType> = Unpromise<ReturnType<RPCHandlerOfType<T>>>;

type Unpromise<T> = T extends Promise<infer U> ? U : any;
