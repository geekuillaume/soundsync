#include <napi.h>
#include "../deps/speex/speex_resampler.h"
#include "resampler.hh"

Napi::FunctionReference SpeexResampler::constructor;

Napi::Object SpeexResampler::Init(Napi::Env env, Napi::Object exports) {
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(
      env, "SpeexResampler", {
        InstanceMethod("processChunk", &SpeexResampler::ProcessChunk)
  });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("SpeexResampler", func);
  return exports;
}

SpeexResampler::SpeexResampler(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<SpeexResampler>(info) {
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  int err = 0;
  int quality = 7;

  if (info.Length() != 3 && info.Length() != 4) {
    throw Napi::Error::New(env, "Should get 3 or 4 arguments: channels, inRate, outRate, [quality]");
  }

  if (!info[0].IsNumber() || info[0].As<Napi::Number>().Int32Value() < 1) {
    throw Napi::Error::New(env, "First argument channels should be a number greater or equal to 1");
  }
  this->channels = info[0].As<Napi::Number>().Int32Value();

  if (!info[1].IsNumber() || info[1].As<Napi::Number>().Int32Value() < 1) {
    throw Napi::Error::New(env, "Second argument inRate should be a number greater or equal to 1");
  }
  this->inRate = info[1].As<Napi::Number>().Int32Value();

  if (!info[2].IsNumber() || info[2].As<Napi::Number>().Int32Value() < 1) {
    throw Napi::Error::New(env, "Third argument outRate should be a number greater or equal to 1");
  }
  this->outRate = info[2].As<Napi::Number>().Int32Value();

  if (info.Length() == 4) {
    if (!info[3].IsNumber() || info[3].As<Napi::Number>().Int32Value() < 1 || info[3].As<Napi::Number>().Int32Value() > 10) {
      throw Napi::Error::New(env, "Fourth argument quality should be a number between 1 and 10");
    }
    quality = info[3].As<Napi::Number>().Int32Value();
  }


  this->resampler = speex_resampler_init(this->channels, this->inRate, this->outRate, quality, &err);
  if (err != 0) {
    throw Napi::Error::New(env, "Error while initializing speex");
  }
  // speex_resampler_skip_zeros(this->resampler);
};

SpeexResampler::~SpeexResampler() {
  speex_resampler_destroy(this->resampler);
}

Napi::Value SpeexResampler::ProcessChunk(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsBuffer()) {
    throw Napi::Error::New(env, "One argument required of type Buffer representing interleaved 16bits PCM data");
  }

  uint32_t inSize = info[0].As<Napi::Buffer<int16_t>>().Length() / this->channels;
  uint32_t initialSamples = inSize;

  uint32_t outSize = ((this->outRate * info[0].As<Napi::Buffer<int16_t>>().Length()) / this->inRate);
  uint32_t outBufferSize = outSize;
  auto outBuffer = Napi::Buffer<int16_t>::New(env, outSize);

  int err = speex_resampler_process_interleaved_int(
    this->resampler,
    info[0].As<Napi::Buffer<int16_t>>().Data(),
    &inSize,
    outBuffer.Data(),
    &outSize
  );

  if (err != 0) {
    throw Napi::Error::New(env, "Invalid data");
  }
  // auto test = Napi::Object::New(env);

  // test.Set("initialSize", initialSamples);
  // test.Set("treatedSize", inSize);
  // test.Set("outBufferSize", outBufferSize);
  // test.Set("bytesTreated", outSize);
  // test.Set("outRate", this->outRate);
  // test.Set("inRate", this->inRate);
  // test.Set("channels", this->channels);
  // test.Set("calc1", ((this->outRate * info[0].As<Napi::Buffer<int16_t>>().Length()) / this->inRate));

  // return test;
  // return Napi::Buffer<int16_t>::New(env, outBuffer, outSize);
  return outBuffer;
}



Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  return SpeexResampler::Init(env, exports);
}

NODE_API_MODULE(speex, InitAll)
