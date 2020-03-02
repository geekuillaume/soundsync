import { EventEmitter } from 'events';
import { createHash } from 'crypto';

// we cannot use the once method of events because it's not implemented in the browser
export const once = (eventEmitter: EventEmitter, event: string) => new Promise((resolve) => {
  eventEmitter.once(event, resolve);
});

export const sha1sum = (buf: Buffer) => {
  const hash = createHash('sha1');
  hash.update(buf);
  return hash.digest('hex');
};
