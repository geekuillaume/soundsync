import hue from 'node-hue-api';

export const onHueScanRPC = async () => {
  const bridges = await hue.v3.discovery.nupnpSearch();
  return bridges.map((bridge) => ({
    name: bridge.name as string,
    ip: bridge.ipaddress as string,
  }));
};
