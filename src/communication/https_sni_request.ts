const listeners = [];

export const onSniRequest = (listener: (serverName: string) => Promise<any>) => {
  listeners.push(listener);
};

export const sniRequestReceived = async (serverName: string) => {
  await Promise.all(listeners.map((listener) => listener(serverName)));
};
