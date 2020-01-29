import { readFileSync, existsSync, writeFileSync, writeFile } from 'fs';
import { resolve } from 'path';
import { hostname } from 'os';
import {promisify} from 'util';
import envPaths from 'env-paths';
import mkdirp from 'mkdirp';
import uuidv4 from 'uuid/v4';
import debug from 'debug';
import _ from 'lodash';
import { SinkDescriptor } from '../audio/sinks/sink_type';
import { SourceDescriptor } from '../audio/sources/source_type';
import { Pipe, PipeDescriptor } from './pipe';

const log = debug(`soundsync:config`);

const writeFilePromisified = promisify(writeFile);

interface ConfigData {
  name: string;
  uuid: string;
  sinks: SinkDescriptor[];
  sources: SourceDescriptor[];
  pipes: Pipe[];
  autoDetectAudioDevices: boolean;
}

const defaultConfig: ConfigData = {
  name: hostname(),
  uuid: uuidv4(),
  sinks: [],
  sources: [],
  pipes: [],
  autoDetectAudioDevices: true,
};

const defaultPaths = envPaths('soundsync', {
  suffix: '',
});
let config: {
  configDir: string;
  configFilePath: string;
  configData: ConfigData;
};

export const initConfig = (dirOverride) => {
  const configDir = dirOverride ? dirOverride : defaultPaths.config;
  try {
    mkdirp.sync(configDir);
  } catch (e) {
    console.error(`Couldn't create config directory at ${configDir}`, e);
    process.exit(1);
  }
  const configFilePath = resolve(configDir, 'config.json');
  log(`Reading config from ${configFilePath}`);
  if (!existsSync(configFilePath)) {
    writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
  }
  try {
    let configData = JSON.parse(readFileSync(configFilePath).toString() || '{}');
    config = {
      configDir,
      configFilePath,
      configData: configData || {},
    };
  } catch (e) {
    console.error(`Error while parsing config file at ${configFilePath}`);
    console.error(e);
    process.exit(1);
  }
}

export const getConfig = () => config.configData;

export const setConfig = (setter: (config: ConfigData) => any) => {
  setter(config.configData);
  // for simplicity reasons, we start the writing of the file but we don't wait for it to continue
  writeFilePromisified(config.configFilePath, JSON.stringify(config.configData, null, 2));
}

export const getConfigField = <T extends keyof ConfigData>(field: T) => {
  if (config.configData[field] === undefined) {
    setConfig((configData) => {
      configData[field] = defaultConfig[field];
    });
  }
  return config.configData[field];
}

export function updateConfigArrayItem(field: 'sources', item: SourceDescriptor): void;
export function updateConfigArrayItem(field: 'sinks', item: SinkDescriptor): void;
export function updateConfigArrayItem(field: 'pipes', item: PipeDescriptor): void;
export function updateConfigArrayItem(field: 'sources' | 'sinks' | 'pipes', item) {
  setConfig((config) => {
    let existingItem;
    if (field === 'pipes') {
      existingItem = _.find(getConfigField(field), {sourceUuid: item.sourceUuid, sinkUuid: item.sinkUuid});
    } else {
      existingItem = _.find(getConfigField(field), (t: SinkDescriptor | SourceDescriptor) => t.type === item.type && (!t.uuid || t.uuid === item.uuid));
    }
    if (existingItem) {
      _.assign(existingItem, item);
    } else {
      getConfigField(field).push(item);
    }
  });
}

export function deleteConfigArrayItem(field, item) {
  setConfig((config) => {
    let existingItem;
    if (field === 'pipes') {
      existingItem = _.find(getConfigField(field), {sourceUuid: item.sourceUuid, sinkUuid: item.sinkUuid});
    } else {
      existingItem = _.find(getConfigField(field), (t: SinkDescriptor | SourceDescriptor) => t.type === item.type && (!t.uuid || t.uuid === item.uuid));
    }
    config[field] = getConfigField(field).filter((i) => i !== existingItem);
  });
}
