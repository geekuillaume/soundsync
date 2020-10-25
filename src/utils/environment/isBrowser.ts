// process.browser check is required as in the webaudio worklet context `window` will be undefined
// @ts-ignore
export const isBrowser = typeof window !== 'undefined' || process.browser === true;
