import { AudioServer, AudioDevice } from 'audioworklet';
import _ from 'lodash';
import debug from 'debug';

const l = debug('soundsync:localAudioDevice');

let audioServer: AudioServer;
const deviceChangeListeners: (() => any)[] = [];

export const getAudioServer = () => {
  if (!audioServer) {
    l(`Creating audio server`);
    audioServer = new AudioServer({
      onDeviceChange: _.debounce(() => {
        deviceChangeListeners.forEach((listener) => listener());
      }, 200),
    });
    l(`Created audio server`);
  }
  return audioServer;
};

export const getAudioDevices = () => getAudioServer().getDevices();

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
