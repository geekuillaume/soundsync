export const APP_NAME = 'Soundsync';
export const CONTROLLER_CHANNEL_ID = 42;
export const OPUS_ENCODER_RATE = 48000;
export const OPUS_ENCODER_CHUNKS_PER_SECONDS = 100;
export const OPUS_ENCODER_CHUNK_DURATION = 1000 / OPUS_ENCODER_CHUNKS_PER_SECONDS;
export const OPUS_ENCODER_CHUNK_SAMPLES_COUNT = OPUS_ENCODER_RATE / OPUS_ENCODER_CHUNKS_PER_SECONDS; // 100 chunks per second = 10ms per chunk
export const NO_RESPONSE_TIMEOUT = 5000; // if there if no response from a wrtc peer during this time, assume connection is lost
export const AUDIO_CHANNEL_OPTIONS: RTCDataChannelInit = {
  ordered: true,
  maxPacketLifeTime: 1000,
};
export const ICE_GATHERING_TIMEOUT = 20000;

export const FORCED_STREAM_LATENCY = 200;
export const SOUNDSYNC_VERSION = '0.1.0';

// if more than 10ms between real position and emitted position than resync stream, this will emit an audible glitch
export const MIN_SKEW_TO_RESYNC_AUDIO = 10;
export const MIN_AUDIODEVICE_CLOCK_SKEW_TO_RESYNC_AUDIO = 50;

// if more than 10ms of drift, start correcting with soft sync (inserting or removing samples in the stream)
export const SOFT_SYNC_MIN_AUDIO_DRIFT = 10;
// if more than 100ms of drift, correct by making a hard sync (pausing the output or discarding a chunk of samples)
export const HARD_SYNC_MIN_AUDIO_DRIFT = 100;

export const SOURCE_MIN_LATENCY_DIFF_TO_RESYNC = 300; // if sinks (connected to a source) latencies are reduced by this much, reduce the latency of the source are resync everyone
export const LATENCY_MARGIN = 300; // latency added by default to each source to prevent glitches because of network drops

export const RENDEZVOUS_SERVICE_URL = process.env.RENDEZVOUS_SERVICE_URL ?? 'https://soundsync.app';
export const RENDEZVOUS_SERVICE_REGISTER_INTERVAL = 1000 * 60 * 60 * 4; // every 4 hours
export const EMPTY_IMAGE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==', 'base64');

export const WILDCARD_DNS_DOMAIN_NAME = `sslip.io`;

export const CHROMECAST_APPID = 'BEB12660';

export const INACTIVE_TIMEOUT = 30 * 1000; // 30 seconds, after this period without sound, a source will be marked as inactive and all linked sinks will be stopped

export const MAX_LATENCY = 10 * 1000; // this is used to size the buffers in various places in the code, for now they are not dynamicly sized and will use this value to store at maximum X seconds of audio
