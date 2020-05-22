import { Soundio } from 'audioworklet';

let soundio: Soundio;

export const getSoundio = () => {
  if (!soundio) {
    soundio = new Soundio();
  }
  return soundio;
};

export const getAudioDevices = async () => {
  await getSoundio().refreshDevices();
  return getSoundio().getDevices();
};

export const audioApiSupportsLoopback = () => getSoundio().getApi() === 'WASAPI';
export const getOutputDeviceFromId = async (deviceId: string) => {
  if (!deviceId) {
    return null;
  }
  return (await getAudioDevices()).outputDevices.find((device) => device.id === deviceId);
};

export const getInputDeviceFromId = async (deviceId: string) => {
  if (!deviceId) {
    return null;
  }
  return (await getAudioDevices()).inputDevices.find((device) => device.id === deviceId);
};
