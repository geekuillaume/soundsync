// Inspired by https://github.com/afaden/node_airtunes

export const SAMPLE_RATE = 44100;
export const CHANNELS = 2;
export const FRAMES_PER_PACKET = 352;
export const TIME_PER_PACKET = FRAMES_PER_PACKET / (SAMPLE_RATE / 1000);
