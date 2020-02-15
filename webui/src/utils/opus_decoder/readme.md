
```
./autogen.sh
emconfigure ./configure --disable-extra-programs --disable-doc --disable-intrinsics --disable-hardening --disable-rtcd --disable-stack-protector
emmake make
emcc -o opus_decoder.js -s EXPORT_ES6=1 -s MODULARIZE=1 -s EXPORT_NAME="Opus" -s USE_ES6_IMPORT_META=0 -s FILESYSTEM=0 -s EXPORTED_RUNTIME_METHODS="['setValue', 'getValue']" -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_opus_decoder_create','_opus_decode_float','_opus_decoder_ctl','_opus_decoder_destroy']" ./opus/.libs/libopus.a
```

Then move the opus_decoder.wasm to `src/static` folder.
