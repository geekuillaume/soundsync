import { Soundio } from 'audioworklet';

let soundio: Soundio;

export const getSoundio = () => {
  if (!soundio) {
    soundio = new Soundio();
  }
  return soundio;
};

export const getAudioDevices = () => getSoundio().getDevices();
export const audioApiSupportsLoopback = () => getSoundio().getApi() === 'WASAPI';
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
