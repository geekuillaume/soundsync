import { AudioServer, AudioDevice } from 'audioworklet';

let audioServer: AudioServer;

export const getAudioServer = () => {
  if (!audioServer) {
    audioServer = new AudioServer();
  }
  return audioServer;
};

export const getAudioDevices = () => getAudioServer().getDevices();

export const audioApiSupportsLoopback = () => getAudioServer().getApi() === 'WASAPI';
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
