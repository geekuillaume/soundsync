// This file replace the audify module used in the NodeJS implementation of Soundsync
// We only need the Opus decoded for the web integration so we can safely ignore the other classes

import { OpusDecoder } from './opus_decoder/decoder';

export { OpusDecoder };
