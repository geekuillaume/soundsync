
const callbacks = [];
export const onExit = (callback) => {
  callbacks.push(callback);
};

// @ts-ignore
if (!process.browser) {
  process.on('SIGINT', async () => {
    await Promise.all(callbacks.map((callback) => callback()));
    process.exit(0);
  });
}
