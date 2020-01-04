export const CONTROLLER_CHANNEL_ID = 42;
export const AUDIO_SOURCE_SAMPLES_PER_SECOND = 100; // 10 ms per sample
export const OPUS_ENCODER_RATE = 48000;
export const NO_RESPONSE_TIMEOUT = 2000; // if there if no response from a wrtc peer during this time, assume connection is lost
export const HEARTBEAT_INTERVAL = 300; // send a heartbeat every 300 ms
export const HEARTBEAT_JITTER = 100; // randomize heartbeat sending interval between peers
