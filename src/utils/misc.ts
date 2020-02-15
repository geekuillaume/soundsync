import { EventEmitter } from 'events';

// we cannot use the once method of events because it's not implemented in the browser
export const once = (eventEmitter: EventEmitter, event: string) => new Promise((resolve) => {
  eventEmitter.once(event, resolve);
});
