import os from 'os';

export const getInternalIps = () => {
  const ifaces = os.networkInterfaces();

  return Object.values(ifaces)
    .flatMap((iface) => iface
      .filter((info) => info.family === 'IPv4' && info.internal === false)
      .map(({ address }) => address));
};
