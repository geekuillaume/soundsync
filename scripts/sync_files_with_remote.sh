#!/usr/bin/env bash
set -e
# This is used when working with a distant ssh peer which has rsync
# first argument needs to be the ssh connection string ([user@]host)

while true; do
    sleep 1
    rsync -avz --exclude node_modules --exclude .cache ./{src,app,webui,package.json,yarn.lock} $1
    inotifywait -r -e modify,create,delete,move ./src ./app ./package.json ./webui
done
