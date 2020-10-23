/* eslint-disable no-control-regex */
import util from 'util';
import debug from 'debug';
import { isBrowser } from './isBrowser';

const MAX_LOG_LINES = 1000;
const logLines = [];

const l = debug('soundsync');

l.log = (...args) => {
  if (!isBrowser) {
    // This regex removes terminal control characters used by debug for color output
    // @ts-ignore
    logLines.push(util.format(...args).replace(/\x1B[^m]+m/g, ' ').trim());
  }
  console.log(...args);
};

if (!isBrowser) {
  // remove old logLines to prevent memory leak
  setInterval(() => {
    if (logLines.length > MAX_LOG_LINES) {
      logLines.splice(0, logLines.length - MAX_LOG_LINES);
    }
  }, 20000);
}

export const getLogHistory = () => logLines;

export { l };

export default debug;
