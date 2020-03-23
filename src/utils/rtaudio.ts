import { RtAudio } from 'audioworklet';

let rtAudio: RtAudio;

export const getRtAudio = () => {
  if (!rtAudio) {
    rtAudio = new RtAudio();
  }
  return rtAudio;
};

export const getAudioDevices = () => getRtAudio().getDevices();
export const audioApiSupportsLoopback = () => getRtAudio().getApi() === 'WASAPI';
