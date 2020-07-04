import hue from 'node-hue-api';
import Api from 'node-hue-api/lib/api/Api';
import { getConfigField } from '../coordinator/config';
import { delay } from './misc';
import { getLocalPeer } from '../communication/local_peer';
import { APP_NAME } from './constants';
import { patchSharedState } from '../coordinator/shared_state';

const apiByHost: {[host: string]: Api} = {};

export const getHueCredentialsByHost = (hueBridgeHost: string) => {
  const savedHueBridges = getConfigField('sharedState').hueBridges;
  const savedHueBridgeInfo = savedHueBridges.find((bridge) => bridge.host === hueBridgeHost && bridge.clientKey && bridge.username);
  return savedHueBridgeInfo;
};

export const getAuthentifiedApi = async (hueBridgeHost: string) => {
  if (apiByHost[hueBridgeHost]) {
    return apiByHost[hueBridgeHost];
  }
  const savedHueBridges = getConfigField('sharedState').hueBridges;
  const savedHueBridgeInfo = savedHueBridges.find((bridge) => bridge.host === hueBridgeHost && bridge.clientKey && bridge.username);
  if (savedHueBridgeInfo) {
    try {
      const api = await hue.v3.api.createLocal(savedHueBridgeInfo.host).connect(savedHueBridgeInfo.username, savedHueBridgeInfo.clientKey, null);
      apiByHost[hueBridgeHost] = api;
      return api;
    } catch (e) {
      // on error, try connecting without auth info
    }
  }
  const unauthenticatedApi = await hue.v3.api.createLocal(hueBridgeHost).connect();
  const tryCreatingUser = async (retryCount) => {
    try {
      const createdUser = await unauthenticatedApi.users.createUser(APP_NAME, getLocalPeer().name);
      return createdUser;
    } catch (e) {
      if (retryCount > 0 && e.getHueErrorType && e.getHueErrorType() === 101) {
        // hue link button wasn't pressed, try again in a second
        await delay(1000);
        return tryCreatingUser(retryCount - 1);
      }
      throw e;
    }
  };
  const createdUser = await tryCreatingUser(60); // 60 seconds before failing
  patchSharedState((sharedState) => {
    sharedState.hueBridges = sharedState.hueBridges || [];
    sharedState.hueBridges = sharedState.hueBridges.filter((bridge) => bridge.host !== hueBridgeHost);
    sharedState.hueBridges.push({
      host: hueBridgeHost,
      clientKey: createdUser.clientkey,
      username: createdUser.username,
    });
    return sharedState;
  });
  const api = await hue.v3.api.createLocal(hueBridgeHost).connect(createdUser.username, createdUser.clientkey, null);
  apiByHost[hueBridgeHost] = api;
  return api;
};

export const get2BytesOfFractionNumber = (val) => {
  const buf = Buffer.alloc(2);
  buf.writeUInt16BE(Math.round(val * 0xffff), 0);
  return [
    buf.readUInt8(0),
    buf.readUInt8(1),
  ];
};
