/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import { onStartSource } from './startSource';
import { onStartChromecast } from './startChromecast';
import { onHueScanRPC, onHueGetEntertainmentZones } from './huelights';
import { onCreateSink } from './createSink';
import { onScanChromecast } from './scanChromecast';
import { onSharedStateUpdate } from './sharedStateUpdate';
import { onDeleteSink } from './deleteSink';
import { onScanAirplaySpeaker } from './scanAirplay';

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
  deleteSink: onDeleteSink,
  updateSharedState: onSharedStateUpdate,
  scanChromecast: lazyLoader(() => import(/* webpackChunkName: "chromecast" */ './scanChromecast'), (m) => m.onScanChromecast) as typeof onScanChromecast,
  startChromecast: lazyLoader(() => import(/* webpackChunkName: "chromecast" */ './startChromecast'), (m) => m.onStartChromecast) as typeof onStartChromecast,
  startSource: onStartSource, // used to start a source when it's considered inactive to determine if it's active or not (for example for a localdevice source)
  scanAirplay: lazyLoader(() => import(/* webpackChunkName: "airplay" */ './scanAirplay'), (m) => m.onScanAirplaySpeaker) as typeof onScanAirplaySpeaker,
};

export type RPCType = keyof typeof rpcHandlers;

export type RPCHandlerOfType<T extends RPCType> = typeof rpcHandlers[T];
export type RPCRequestBody<T extends RPCType> = Parameters<RPCHandlerOfType<T>>[1];
export type RPCResponseBody<T extends RPCType> = Unpromise<ReturnType<RPCHandlerOfType<T>>>;

type Unpromise<T> = T extends Promise<infer U> ? U : any;
