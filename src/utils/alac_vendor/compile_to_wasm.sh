#!/usr/bin/env bash
set -eo pipefail

emcc \
  -s INITIAL_MEMORY=128MB \
  -s ALLOW_MEMORY_GROWTH=0 \
  -O3 \
  -o ./alac_wasm.js \
  -s EXPORT_ES6=1 \
  -s MODULARIZE=1 \
  -s SINGLE_FILE=1 \
  -s USE_ES6_IMPORT_META=0 \
  -s EXPORT_NAME="Alac" \
  -s ASSERTIONS=0 \
  -s NODEJS_CATCH_REJECTION=0 \
  -s NODEJS_CATCH_EXIT=0 \
  -s EXPORTED_RUNTIME_METHODS="['setValue', 'getValue', 'AsciiToString']" \
  -s ENVIRONMENT=node,web \
  -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_initiate_alac_encoder','_alac_encode','_destroy_encoder']" \
  ./source/*.cpp ./source/*.c ./glue.cpp

