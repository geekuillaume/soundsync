import nodeCleanup from 'node-cleanup';

const callbacks = [];
export const onExit = (callback) => {
  callbacks.push(callback);
};

export const exit = async (code: number, async = false, signal?: any) => {
  const exitPromise = Promise.all(callbacks.map((callback) => callback()));
  if (async) {
    // TODO: debug this to wait for all promises on Ctrl+C
    await exitPromise;
  }
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code);
  }
};

// @ts-ignore
if (!process.browser) {
  nodeCleanup((exitCode, signal) => {
    if (signal) {
      exit(exitCode, true);
      nodeCleanup.uninstall();
      return false;
    }
    return true;
  });
}
