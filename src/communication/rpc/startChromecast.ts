import { Peer } from '../peer';
import { startSoundsyncOnChromecast } from '../../utils/chromecast';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onStartChromecast = async (_peer: Peer, host: string) => {
  await startSoundsyncOnChromecast(host);
};
