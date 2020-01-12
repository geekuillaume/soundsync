export const CONTROLLER_CHANNEL_ID = 42;
export const OPUS_ENCODER_RATE = 48000;
export const OPUS_ENCODER_SAMPLES_PER_SECONDS = 100;
export const OPUS_ENCODER_FRAME_SAMPLES_COUNT = OPUS_ENCODER_RATE / OPUS_ENCODER_SAMPLES_PER_SECONDS; // 100 samples per second = 10ms per sample
export const NO_RESPONSE_TIMEOUT = 2000; // if there if no response from a wrtc peer during this time, assume connection is lost
export const HEARTBEAT_INTERVAL = 300; // send a heartbeat every 300 ms
export const HEARTBEAT_JITTER = 100; // randomize heartbeat sending interval between peers
export const AUDIO_CHANNEL_OPTIONS: RTCDataChannelInit = {
  ordered: false,
  maxPacketLifeTime: 10,
}
export const ICE_GATHERING_TIMEOUT = 20000;
