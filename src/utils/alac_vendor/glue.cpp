#include "./source/ALACEncoder.h"
#include "./source/ALACBitUtilities.h"
#include <stdio.h>

// Inspired from https://github.com/afaden/node_airtunes

static unsigned int kBlockSize = 16;
static unsigned int kFramesPerPacket = 352;

static AudioFormatDescription outputFormat = {
  .mSampleRate = 44100,
  .mFormatID = kALACFormatAppleLossless,
  .mFormatFlags = 1,
  .mBytesPerPacket = 0,
  .mFramesPerPacket = kFramesPerPacket,
  .mBytesPerFrame = 0,
  .mChannelsPerFrame = 2,
  .mBitsPerChannel = 0,
  .mReserved = 0
};

AudioFormatDescription inputFormat = {
  .mSampleRate = 44100,
  .mFormatID = kALACFormatLinearPCM,
  .mFormatFlags = 12,
  .mBytesPerPacket = 4,
  .mFramesPerPacket = 1,
  .mBytesPerFrame = 4,
  .mChannelsPerFrame = 2,
  .mBitsPerChannel = 16,
  .mReserved = 0
};


extern "C" {
  ALACEncoder *initiate_alac_encoder() {
    ALACEncoder *encoder = new ALACEncoder();

    encoder->SetFrameSize(kFramesPerPacket);
    encoder->InitializeEncoder(outputFormat);

    return encoder;
  }

  int alac_encode(ALACEncoder *encoder, unsigned char *pcmData, unsigned char *alacData, int bufferSize) {
    int size = bufferSize;
    int status = encoder->Encode(inputFormat, outputFormat, pcmData, alacData, &size);
    if (status != 0) {
      return -1;
    }
    return size;
  }

  void destroy_encoder(ALACEncoder *encoder) {
    delete encoder;
  }
}
