import { resolve } from 'path';
import { promises as fsPromises, createWriteStream, createReadStream } from 'fs';

import { Extract } from 'unzipper';
import { l } from './log';
import { getConfigDir } from '../../coordinator/config';
import { sha1sum, once } from '../misc';

// fsPromise is undefined when executed in a web browser context
const { readFile, chmod } = fsPromises || {};

const log = l.extend(`depsDownloader`);
import request = require('superagent');

const deps = {
  librespot: {
    isZip: false,
    executableName: null,
    'linux-x64': {
      url: 'https://github.com/geekuillaume/librespot/releases/download/v0.4.1/librespot-linux-x64-featureless',
      sha1: '1b25a0880f1babcf71afc966280b0a9b88024853',
    },
    'linux-arm': {
      url: 'https://github.com/geekuillaume/librespot/releases/download/v0.4.1/librespot-linux-arm-featureless',
      sha1: '3822d7304641d3928c6a8d08553dcdebfbc82f9b',
    },
    'darwin-x64': {
      url: 'https://github.com/geekuillaume/librespot/releases/download/v0.4.1/librespot-macos-x64-featureless',
      sha1: '47a188c7de9b15af75cbc3e1cf62ca0346c3e4f9',
    },
    'win32-x64': {
      url: 'https://github.com/geekuillaume/librespot/releases/download/v0.4.1/librespot-windows-x64-featureless.exe',
      sha1: 'd2f7e42d3ecd333666ca0933f28fa4356400c0ef',
    },
  },
  shairport: {
    isZip: true,
    executableName: 'shairport-sync',
    'linux-x64': {
      url: 'https://github.com/geekuillaume/shairport-sync/releases/download/20200428/shairport-sync-Linux-x64.zip',
      sha1: 'ee8594c0b8387b1a1c85c083dbf74ee3e1e85ffd',
    },
    'linux-arm': {
      url: 'https://github.com/geekuillaume/shairport-sync/releases/download/20200428/shairport-sync-Linux-arm.zip',
      sha1: 'e1575248de0dd17d627212b44d999025197061e2',
    },
    'darwin-x64': {
      url: 'https://github.com/geekuillaume/shairport-sync/releases/download/20200428/shairport-sync-macOS-x64.zip',
      sha1: '6eea636077a5bb09ed77d7b42ed3b05aa01b51d2',
    },
  },
};

const depPath = <T extends keyof typeof deps>(depName: T) => resolve(getConfigDir(), depName);

export const isDepAvailableForPlatform = <T extends keyof typeof deps>(depName: T) => {
  if (typeof process === 'undefined') {
    return false;
  }
  const dep = deps[depName];
  const downloadInfo = dep[`${process.platform}-${process.arch}`];
  if (!downloadInfo) {
    return false;
  }
  return true;
};

export const ensureDep = async <T extends keyof typeof deps>(depName: T) => {
  if (!isDepAvailableForPlatform(depName)) {
    throw new Error('Arch or os is not supported');
  }
  const dep = deps[depName];
  const downloadInfo = dep[`${process.platform}-${process.arch}`];
  let path = depPath(depName);
  if (dep.isZip) {
    path = `${path}.zip`;
  } else if (process.platform === 'win32') {
    path += '.exe'; // the exe extension is required for a window executable
  }
  try {
    log(`Ensuring dep ${depName} at ${path}`);
    const file = await readFile(path);
    const sha1 = sha1sum(file);
    if (sha1 !== downloadInfo.sha1) {
      throw new Error('Hash do not match');
    }
  } catch (e) {
    // TODO: on error, remove zip folder
    log(`Dep is not suitable, downloading from ${downloadInfo.url}`, e.message);
    const req = request.get(downloadInfo.url);
    const writeStream = createWriteStream(path);
    req.pipe(writeStream);
    await once(writeStream, 'finish');
    if (deps[depName].isZip) {
      const zipStream = createReadStream(path);
      const unzipStream = Extract({
        path: depPath(depName),
      });
      zipStream.pipe(unzipStream);
      await once(unzipStream, 'finish');
      const executablePath = resolve(depPath(depName), dep.executableName);
      await chmod(executablePath, '775');
    } else {
      await chmod(path, '775');
    }
    log(`Downloaded dep to ${path}`);
  }
  if (dep.isZip) {
    return resolve(depPath(depName), dep.executableName);
  }
  return path;
};
