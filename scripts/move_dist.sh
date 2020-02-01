#!/bin/bash

mkdir dist-linux dist-mac dist-win > /dev/null 2>&1

mv bin/latest-linux.yml bin/*.AppImage bin/*.tar.gz bin/*.snap dist-linux > /dev/null 2>&1
mv bin/latest-mac.yml bin/*.dmg bin/*.dmg.blockmap dist-mac > /dev/null 2>&1
mv bin/latest.yml bin/*.exe bin/*.exe.blockmap dist-win > /dev/null 2>&1

exit 0
