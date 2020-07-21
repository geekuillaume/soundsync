import { Peer } from '../peer';
import { startChromecastDetection, getDetectedChromecasts } from '../../utils/vendor_integrations/chromecast';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onScanChromecast = async (_peer: Peer) => {
  await startChromecastDetection();
  return getDetectedChromecasts();
};
