#!/bin/bash

rm -rf bin/*-unpacked bin/builder-effective-config.yaml bin/*.blockmap bin/mac/* bin/.icon-ico bin/.icon-icns
# Remove whitespace from file names
(for f in bin/*\ *; do mv "$f" "${f// /_}"; done) || true
# Remove uppercase from file names
(for f in bin/*; do mv "$f" "`echo $f | tr 'A-Z' 'a-z'`"; done) || true
