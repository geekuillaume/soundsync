#!/usr/bin/env bash
set -eo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd $DIR
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
docker build ../ --file ./Dockerfile_crossarch --tag multiarch

docker run -it --rm --workdir /workspace \
  -v `realpath ../app`:/workspace/app_tmp \
  -v `realpath ../webui`:/workspace/webui \
  -v `realpath ../res`:/workspace/res \
  -v `realpath ../bin`:/workspace/bin \
  -v `realpath ../scripts`:/workspace/scripts \
  multiarch bash -c "cp -R app_tmp app && \
   rm -rf app/node_modules && \
   mv /tmp/workspace/app/node_modules app/node_modules && \
   cp /tmp/workspace/package.json ./ && \
   mv /tmp/workspace/node_modules ./ && \
   yarn run pack -l deb --armv7l"
