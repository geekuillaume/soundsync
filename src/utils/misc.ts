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
