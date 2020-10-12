#include "./source/ALACEncoder.h"
#include "./source/ALACBitUtilities.h"
#include <stdlib.h>
#include <stdio.h>

// Inspired from https://github.com/afaden/node_airtunes and

static unsigned int kBlockSize = 16;
static unsigned int kFramesPerPacket = 352;

#define min(a,b) (((a) < (b)) ? (a) : (b))
#define max(a,b) (((a) > (b)) ? (a) : (b))
#define kTestFormatFlag_16BitSourceData 1

typedef struct alac_codec_s {
	AudioFormatDescription inputFormat, outputFormat;
	ALACEncoder *encoder;
	unsigned block_size, frames_per_packet;
} alac_codec_t;

extern "C" {
  alac_codec_t *initiate_alac_encoder(int chunk_len, int sampleRate, int sampleSize, int channels) {
    alac_codec_t *codec;

    if ((codec = (alac_codec_t*) malloc(sizeof(alac_codec_t))) == NULL) return NULL;

    if ((codec->encoder = new ALACEncoder) == NULL) {
      free(codec);
      return NULL;
    }

    // input format is pretty much dictated
    codec->inputFormat.mFormatID = kALACFormatLinearPCM;
    codec->inputFormat.mSampleRate = sampleRate;
    codec->inputFormat.mBitsPerChannel = sampleSize;
    codec->inputFormat.mFramesPerPacket = 1;
    codec->inputFormat.mChannelsPerFrame = channels;
    codec->inputFormat.mBytesPerFrame = codec->inputFormat.mChannelsPerFrame * codec->inputFormat.mFramesPerPacket * (codec->inputFormat.mBitsPerChannel / 8);
    codec->inputFormat.mBytesPerPacket = codec->inputFormat.mBytesPerFrame * codec->inputFormat.mFramesPerPacket;
    codec->inputFormat.mFormatFlags = kALACFormatFlagsNativeEndian | kALACFormatFlagIsSignedInteger; // expect signed native-endian data
    codec->inputFormat.mReserved = 0;

    // and so is the output format
    // codec->outputFormat.mFormatID = kALACFormatAppleLossless;
    // codec->outputFormat.mSampleRate = codec->inputFormat.mSampleRate;
    // codec->outputFormat.mFormatFlags = kTestFormatFlag_16BitSourceData;
    // codec->outputFormat.mFramesPerPacket = chunk_len;
    // codec->outputFormat.mChannelsPerFrame = codec->inputFormat.mChannelsPerFrame;
    // codec->outputFormat.mBytesPerPacket = 0; // we're VBR
    // codec->outputFormat.mBytesPerFrame = 0; // same
    // codec->outputFormat.mBitsPerChannel = 0; // each bit doesn't really go with 1 sample
    // codec->outputFormat.mReserved = 0;
    codec->outputFormat.mFormatID = kALACFormatAppleLossless;
    codec->outputFormat.mSampleRate = codec->inputFormat.mSampleRate;
    codec->outputFormat.mFormatFlags = kTestFormatFlag_16BitSourceData;
    codec->outputFormat.mFramesPerPacket = chunk_len;
    codec->outputFormat.mChannelsPerFrame = codec->inputFormat.mChannelsPerFrame;
    codec->outputFormat.mBitsPerChannel = sampleSize; // each bit doesn't really go with 1 sample
    codec->outputFormat.mBytesPerFrame = codec->outputFormat.mBitsPerChannel * codec->outputFormat.mChannelsPerFrame; // same
    codec->outputFormat.mBytesPerPacket = codec->outputFormat.mBytesPerFrame * codec->outputFormat.mFramesPerPacket; // we're VBR
    codec->outputFormat.mReserved = 0;

    codec->encoder->SetFrameSize(codec->outputFormat.mFramesPerPacket);
    codec->encoder->SetFastMode(true);
    codec->encoder->InitializeEncoder(codec->outputFormat);

    return codec;
  }

  int alac_encode(struct alac_codec_s *codec, uint8_t *in, int frames, uint8_t *out) {
    int size = min(frames, (int) codec->outputFormat.mFramesPerPacket) * codec->inputFormat.mBytesPerFrame;
    int i;
    // uint16_t *input = (uint16_t *)in;
    // for (i = 0; i < size / 2; i++) {
    //   input[i] = ((input[i] & 0xff) >> 8) | (input[i] << 8);
    // }
    // seems that ALAC has a bug and creates more data than expected
    // *out = (uint8_t*) malloc(size * 2 + kALACMaxEscapeHeaderBytes + 64);
    codec->encoder->Encode(codec->inputFormat, codec->outputFormat, in, out, &size);

    return size;
  }

  // int alac_encode(ALACEncoder *encoder, unsigned char *pcmData, unsigned char *alacData, int bufferSize) {
  //   int size = bufferSize;
  //   int status = encoder->Encode(inputFormat, outputFormat, pcmData, alacData, &size);
  //   if (status != 0) {
  //     return -1;
  //   }
  //   return size;
  // }

  void destroy_encoder(alac_codec_t *codec) {
    delete codec->encoder;
    free(codec);
  }


  /* ------------------------------- MISC HELPERS ----------------------------- */

/* ALAC bits writer - big endian
 * p    outgoing buffer pointer
 * val  bitfield value
 * blen bitfield length, max 8 bits
 * bpos bit position in the current byte (pointed by *p)
 */
void
alac_write_bits(uint8_t **p, uint8_t val, int blen, int *bpos)
{
  int lb;
  int rb;
  int bd;

  /* Remaining bits in the current byte */
  lb = 7 - *bpos + 1;

  /* Number of bits overflowing */
  rb = lb - blen;

  if (rb >= 0) {
    bd = val << rb;
    if (*bpos == 0) {
    	**p = bd;
    } else {
      **p |= bd;
    }

    /* No over- nor underflow, we're done with this byte */
    if (rb == 0) {
      *p += 1;
      *bpos = 0;
	  } else {
      *bpos += blen;
    }
  } else {
    /* Fill current byte */
    bd = val >> -rb;
    **p |= bd;

    /* Overflow goes to the next byte */
    *p += 1;
    **p = val << (8 + rb);
    *bpos = -rb;
  }
}

/* Raw data must be little endian */
void
alac_encode_raw(uint8_t *dst, uint8_t *raw, int len)
{
  uint8_t *maxraw;
  int bpos;

  bpos = 0;
  maxraw = raw + len;
  alac_write_bits(&dst, 1, 3, &bpos); /* channel=1, stereo */
  alac_write_bits(&dst, 0, 4, &bpos); /* unknown */
  alac_write_bits(&dst, 0, 8, &bpos); /* unknown */
  alac_write_bits(&dst, 0, 4, &bpos); /* unknown */
  alac_write_bits(&dst, 0, 1, &bpos); /* hassize */

  alac_write_bits(&dst, 0, 2, &bpos); /* unused */
  alac_write_bits(&dst, 1, 1, &bpos); /* is-not-compressed */

  for (; raw < maxraw; raw += 4)
    {
      /* Byteswap to big endian */
      alac_write_bits(&dst, *(raw + 1), 8, &bpos);
      alac_write_bits(&dst, *raw, 8, &bpos);
      alac_write_bits(&dst, *(raw + 3), 8, &bpos);
      alac_write_bits(&dst, *(raw + 2), 8, &bpos);
    }
}
}
