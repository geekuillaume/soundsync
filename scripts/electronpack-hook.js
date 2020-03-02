const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

exports.default = async function (context) {
  if (_.some(context.targets, (t) => t.name === 'deb')) {
    fs.renameSync(path.resolve(context.appOutDir, 'soundsync'), path.resolve(context.appOutDir, 'soundsync_electron'));
    fs.writeFileSync(path.resolve(context.appOutDir, 'soundsync'), `#!/usr/bin/env sh
DIR="$( dirname "$( readlink -f "$0" )")"
if [ -z "$DISPLAY" ]
then
  ELECTRON_RUN_AS_NODE=1 $DIR/soundsync_electron $DIR/resources/app.asar/index.js "$@"
else
  $DIR/soundsync_electron
fi`);
    fs.chmodSync(path.resolve(context.appOutDir, 'soundsync'), '755');
    cp.execSync(`cp -r ${path.resolve(__dirname, 'package_extra')} ${context.appOutDir}`);
  }
};
