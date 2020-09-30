const callbacks = [];
export const onExit = (callback) => {
  callbacks.push(callback);
};

export const exit = async (code: number, async = false) => {
  const exitPromise = Promise.all(callbacks.map((callback) => callback()));
  if (async) {
    await exitPromise;
  }
  process.exit(code);
};

// @ts-ignore
if (!process.browser) {
  process.on('SIGINT', () => {
    exit(0, true);
  });
}
