import { EventEmitter } from 'events';
import { createHash } from 'crypto';

function isEventTarget(target: EventEmitter | EventTarget): target is EventTarget {
  return typeof (target as EventTarget).addEventListener !== 'undefined';
}

// we cannot use the once method of events because it's not implemented in the browser
export const once = (eventEmitter: EventEmitter | EventTarget, event: string) => new Promise((resolve) => {
  const listener = (...args) => {
    if (isEventTarget(eventEmitter)) {
      eventEmitter.removeEventListener(event, listener);
    } else {
      eventEmitter.off(event, listener);
    }
    resolve(...args);
  };

  if (isEventTarget(eventEmitter)) {
    eventEmitter.addEventListener(event, listener);
  } else {
    eventEmitter.on(event, listener);
  }
});

export const sha1sum = (buf: Buffer) => {
  const hash = createHash('sha1');
  hash.update(buf);
  return hash.digest('hex');
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const assert = (condition: any, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars

export const assertNever = (_val: never) => {
  throw new Error('This should never happens');
};

export function destructuredPromise<T>(): [Promise<T>, (res?: T) => any, (e: any) => any] {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return [promise, resolve, reject] as [Promise<any>, () => any, () => any];
}

const performance = typeof window === 'undefined' ? require('perf_hooks').performance : window.performance;

export const now = () => performance.now();
