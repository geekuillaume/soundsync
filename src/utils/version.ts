import { version } from '../package.json';

const removeDevSuffix = (str) => str.replace('-dev', '');

export const GIT_COMMIT = '%BUILD_VERSION%';

export const BUILD_VERSION_NOT_SANITIZED = process.env.BUILD_VERSION || version;
export const BUILD_VERSION = removeDevSuffix(BUILD_VERSION_NOT_SANITIZED);
