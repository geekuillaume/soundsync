# Opus decoder WASM

Soundsync uses Opus the Opus codec to encode and decode audio stream. For web integration, the browser needs a way to decoded the opus stream. For that, we compile the Opus lib (specifically the decode related code) to Web Assembly.

## Instructions

```
git submodule update --init --recursive
cd src/utils/opus_decoder/opus
./autogen.sh
emconfigure ./configure --disable-extra-programs --disable-doc --disable-intrinsics --disable-hardening --disable-rtcd --disable-stack-protector
emmake make
cd ../
emcc -o opus_decoder.js -s EXPORT_ES6=1 -s MODULARIZE=1 -s SINGLE_FILE=1 -s EXPORT_NAME="Opus" -s USE_ES6_IMPORT_META=0 -s FILESYSTEM=0 -s EXPORTED_RUNTIME_METHODS="['setValue', 'getValue']" -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_opus_decoder_create','_opus_decode_float','_opus_decoder_ctl','_opus_decoder_destroy']" ./opus/.libs/libopus.a
```

Then move the `opus_decoder.wasm` file to `src/static`.
