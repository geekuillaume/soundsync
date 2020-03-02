import { resolve } from 'path';
import { readFile, createWriteStream, chmod } from 'fs';
import { promisify } from 'util';
import debug from 'debug';
import { getConfigDir } from '../coordinator/config';
import { sha1sum, once } from './misc';

const l = debug(`soundsync:depsDownloader`);
import request = require('superagent');

const readFilePromisified = promisify(readFile);
const chmodPromisified = promisify(chmod);

const deps = {
  librespot: {
    x64: {
      url: 'https://github.com/geekuillaume/librespot/releases/download/v0.1.1/librespot-linux-x64-featureless',
      sha1: 'ef8a32d0e846e8708b389460282545be3383bb05',
    },
    arm: {
      url: 'https://github.com/geekuillaume/librespot/releases/download/v0.1.1/librespot-linux-arm-featureless',
      sha1: '95a3414d546bd106145f87943d6ed83bc347f339',
    },
  },
};

const depPath = <T extends keyof typeof deps>(depName: T) => resolve(getConfigDir(), depName);

export const ensureDep = async <T extends keyof typeof deps>(depName: T) => {
  const path = depPath(depName);
  const dep = deps[depName][process.arch];
  if (!dep) {
    throw new Error('Arch is not supported');
  }
  try {
    l(`Ensuring dep ${depName} at ${path}`);
    const file = await readFilePromisified(path);
    const sha1 = sha1sum(file);
    if (sha1 !== dep.sha1) {
      throw new Error('Hash do not match');
    }
  } catch (e) {
    l(`Dep is not suitable, downloading from ${dep.url}`, e.message);
    const req = request.get(dep.url);
    const writeStream = createWriteStream(path);
    req.pipe(writeStream);
    await once(writeStream, 'finish');
    await chmodPromisified(path, '555');
    l(`Downloaded dep to ${path}`);
  }
  return path;
};
