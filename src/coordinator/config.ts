/* eslint-disable no-console */
import {
  readFileSync, existsSync, writeFileSync,
} from 'fs';
import { resolve } from 'path';
import { hostname } from 'os';
import envPaths from 'env-paths';
import mkdirp from 'mkdirp';
import { v4 as uuidv4 } from 'uuid';
import debug from 'debug';
import _ from 'lodash';
import produce from 'immer';
import { isBrowser } from '../utils/environment/isBrowser';
import { SinkDescriptor } from '../audio/sinks/sink_type';
import { SourceDescriptor } from '../audio/sources/source_type';
import { AudioSource } from '../audio/sources/audio_source';
import { AudioSink } from '../audio/sinks/audio_sink';
import { SharedState } from './shared_state';

const log = debug(`soundsync:config`);

interface ConfigData {
  name: string;
  uuid: string;
  sinks: SinkDescriptor[];
  sources: SourceDescriptor[];
  autoDetectAudioDevices: boolean;
  port: number;
  peers: string[];
  detectPeersOnLocalNetwork: boolean;
  enableRendezvousService: boolean;
  sharedState: SharedState;
}

const defaultConfig: ConfigData = {
  name: hostname(),
  uuid: uuidv4(),
  sinks: [],
  sources: [],
  autoDetectAudioDevices: true,
  port: 6512,
  peers: [],
  detectPeersOnLocalNetwork: true,
  enableRendezvousService: true,
  sharedState: {
    hueBridges: [],
    lastUpdateTimestamp: -1,
  },
};

let config: {
  configDir: string;
  configFilePath: string;
  configData: ConfigData;
};

export const initConfig = (dirOverride?: string) => {
  config = {
    configDir: '',
    configFilePath: '',
    configData: defaultConfig,
  };

  const configDir = isBrowser ? 'soundsync:config' : (dirOverride || envPaths('soundsync', { suffix: '' }).config);
  const configFilePath = isBrowser ? 'soundsync:config' : resolve(configDir, 'config.json');

  let configRawData;
  if (isBrowser) {
    configRawData = localStorage.getItem(configFilePath) || '{}';
  } else {
    // Creating folder if it doesn't exists
    try {
      mkdirp.sync(configDir);
    } catch (e) {
      console.error(`Couldn't create config directory at ${configDir}`, e);
      process.exit(1);
    }

    log(`Reading config from ${configFilePath}`);
    if (!existsSync(configFilePath)) {
      writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
    }
    configRawData = readFileSync(configFilePath).toString() || '{}';
  }
  try {
    const configData = JSON.parse(configRawData);
    config = {
      configDir,
      configFilePath,
      configData: configData || {},
    };
  } catch (e) {
    console.error(`Error while parsing config file at ${configFilePath}`);
    console.error(e);
    if (!isBrowser) {
      // if it is running in a browser, do nothing and use default config
      process.exit(1);
    }
  }
};

export const getConfigDir = () => config.configDir;
export const getConfigPath = () => config.configFilePath;

export const setConfig = (setter: (config: ConfigData) => any) => {
  const newConfig = produce(config.configData, setter);
  if (newConfig !== config.configData) {
    config.configData = newConfig;
    if (isBrowser) {
      localStorage.setItem(config.configFilePath, JSON.stringify(config.configData));
    } else {
      // TODO: we should use an async version here but for now it simplifies the code and as the config file is small, it's not a latency problem
      writeFileSync(config.configFilePath, JSON.stringify(config.configData, null, 2));
    }
  }
};

export const getConfigField = <T extends keyof ConfigData>(field: T, c?: ConfigData) => {
  const configData = c || config.configData;
  if (configData[field] === undefined) {
    return defaultConfig[field];
  }
  return (c || config.configData)[field];
};


export function updateConfigArrayItem(field: 'sources', item: AudioSource): void;
export function updateConfigArrayItem(field: 'sinks', item: AudioSink): void;
export function updateConfigArrayItem(field: 'sources' | 'sinks', sourceOrSink) {
  setConfig((c) => {
    const descriptor = sourceOrSink.toDescriptor(true);
    // @ts-ignore
    c[field] = c[field] || [];
    // @ts-ignore
    c[field] = c[field].filter((s) => s.uuid && s.uuid !== descriptor.uuid);
    c[field].push(descriptor);
  });
}

export function deleteConfigArrayItem(field, item) {
  setConfig((c) => {
    c[field] = getConfigField(field).filter((s) => s.uuid !== item.uuid);
  });
}
