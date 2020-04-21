const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

exports.default = async function (context) {
  if (_.some(context.targets, (t) => t.name === 'deb')) {
    fs.renameSync(
      path.resolve(context.appOutDir, 'soundsync'),
      path.resolve(context.appOutDir, 'soundsync_electron'),
    );
    fs.writeFileSync(
      path.resolve(context.appOutDir, 'soundsync'),
      fs.readFileSync(path.resolve(__dirname, './systemd_start_script.sh')),
    );
    fs.chmodSync(path.resolve(context.appOutDir, 'soundsync'), '755');
    cp.execSync(`cp -r ${path.resolve(__dirname, 'package_extra')} ${context.appOutDir}`);
  }
};
