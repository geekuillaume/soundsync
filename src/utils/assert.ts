export const assert = (condition: any, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const assertNever = (_val: never) => {
  throw new Error('This should never happens');
};
