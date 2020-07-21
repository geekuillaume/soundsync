import hue from 'node-hue-api';
import { find } from 'lodash';
import { Peer } from '../peer';
import { getAuthentifiedApi } from '../../utils/vendor_integrations/philipshue';

export const onHueScanRPC = async () => {
  const bridges = await hue.v3.discovery.nupnpSearch();
  return bridges.map((bridge) => ({
    name: bridge.name as string,
    ip: bridge.ipaddress as string,
  }));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onHueGetEntertainmentZones = async (_peer: Peer, hueBridgeHost: string) => {
  const api = await getAuthentifiedApi(hueBridgeHost);
  const groups = await api.groups.getEntertainment();
  const lights = await api.lights.getAll();

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    lights: group.lights.map((lightId: string) => {
      const light = find(lights, { _data: { id: Number(lightId) } });
      return {
        name: light.name,
        id: light.id,
      };
    }),
  }));
};
