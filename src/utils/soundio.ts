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
export const getOutputDeviceIndexFromId = (deviceId: string) => {
  if (!deviceId) {
    return -1;
  }
  const deviceIndex = getAudioDevices().outputDevices.map(({ id }) => id).indexOf(deviceId);
  return deviceIndex;
};
