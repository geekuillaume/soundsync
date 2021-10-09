#!/bin/bash
set -e

yarn run build:ts
cp src/utils/audio/opus_wasm.wasm app/utils/audio/opus_wasm.wasm
