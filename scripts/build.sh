#!/bin/bash
set -e

npm run build:ts
cp src/utils/audio/opus_wasm.wasm app/utils/audio/opus_wasm.wasm
