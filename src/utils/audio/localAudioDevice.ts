import { AudioServer, AudioDevice } from 'audioworklet';
import _ from 'lodash';
import { l } from '../environment/log';

const log = l.extend('localAudioDevice');

let audioServer: AudioServer;
const deviceChangeListeners: (() => any)[] = [];

let audioDevices: ReturnType<typeof audioServer.getDevices>;

export const getAudioServer = () => {
  if (!audioServer) {
    log(`Creating audio server`);
    audioServer = new AudioServer({
      onDeviceChange: _.debounce(() => {
        audioDevices = null;
        deviceChangeListeners.forEach((listener) => listener());
      }, 200),
    });
    log(`Created audio server`);
  }
  return audioServer;
};

export const getAudioDevices = () => {
  if (!audioDevices) {
    audioDevices = getAudioServer().getDevices();
  }
  return audioDevices;
};

export const onAudioDevicesChange = (listener: () => void) => deviceChangeListeners.push(listener);

export const audioApiSupportsLoopback = () => getAudioServer().getApi() === 'wasapi';
export const getOutputDeviceFromId = (deviceId: string) => {
  if (!deviceId) {
    return null;
  }
  return getAudioDevices().outputDevices.find((device) => device.id === deviceId);
};

export const getInputDeviceFromId = (deviceId: string) => {
  if (!deviceId) {
    return null;
  }
  return getAudioDevices().inputDevices.find((device) => device.id === deviceId);
};

export const getClosestMatchingRate = (device: AudioDevice, targetRate: number) => Math.min(Math.max(targetRate, device.minRate), device.maxRate);
