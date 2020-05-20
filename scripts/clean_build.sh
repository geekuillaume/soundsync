#!/bin/bash

rm -rf bin/*-unpacked bin/builder-effective-config.yaml bin/*.blockmap bin/*.yml bin/mac/*
(for f in bin/*\ *; do mv "$f" "${f// /_}"; done) || true
