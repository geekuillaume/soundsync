#!/usr/bin/env bash

# This file will be used by the systemd service to start soundsync, it allows soundsync to start without graphical interface
# and will try to start pulseaudio if run as root and no pulseaudio process is found

CURRENT_USER="$(whoami)"

if [ -z "$PULSE_COOKIE" ] && [ -z "$(ps x | grep pulse | grep -v grep)" ] && [ "$CURRENT_USER" == "root" ]
then
  pulseaudio 2> /dev/null &
fi

DIR="$( dirname "$( readlink -f "$0" )")"
if [ -z "$DISPLAY" ]
then
  ELECTRON_RUN_AS_NODE=1 $DIR/soundsync_electron "$@"
else
  $DIR/soundsync_electron "$@"
fi
