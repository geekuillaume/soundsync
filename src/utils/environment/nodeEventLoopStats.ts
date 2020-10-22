import { monitorEventLoopDelay } from 'perf_hooks';
import { l } from './log';

const EVENT_LOOP_BLOCK_THRESHOLD = 20;

const nanoToMilli = (v: number) => v / (10 ** 6);

const log = l.extend('eventloop');

export const registerEventLoopMonitor = () => {
  const h = monitorEventLoopDelay();
  h.enable();

  setInterval(() => {
    if (nanoToMilli(h.max) > EVENT_LOOP_BLOCK_THRESHOLD) {
      log(`last 5 seconds: event loop blocked for ${nanoToMilli(h.max)}ms, mean: ${nanoToMilli(h.mean)}ms`);
    }
    h.reset();
  }, 5000);
};
