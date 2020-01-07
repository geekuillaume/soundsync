#ifndef NODE_SPEEX_RESAMPLER_H
#define NODE_SPEEX_RESAMPLER_H

#include <napi.h>
#include "../deps/speex/speex_resampler.h"

class SpeexResampler : public Napi::ObjectWrap<SpeexResampler> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  static Napi::Object NewInstance(Napi::Env env, Napi::Value arg);
  SpeexResampler(const Napi::CallbackInfo& info);
  ~SpeexResampler();

 private:

  SpeexResamplerState *resampler;
  int channels;
  int inRate;
  int outRate;

  static Napi::FunctionReference constructor;
  Napi::Value ProcessChunk(const Napi::CallbackInfo& info);
};

#endif
