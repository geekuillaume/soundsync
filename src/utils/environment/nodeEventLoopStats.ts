import debug from 'debug';
import { monitorEventLoopDelay } from 'perf_hooks';

const EVENT_LOOP_BLOCK_THRESHOLD = 20;

const nanoToMilli = (v: number) => v / (10 ** 6);

const log = debug('soundsync:eventloop');

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
