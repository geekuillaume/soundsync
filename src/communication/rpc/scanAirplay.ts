import { Peer } from '../peer';
import { startAirplaySpeakerDetection, getDetectedAirplaySpeakers } from '../../utils/vendor_integrations/airplay/airplayDetector';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onScanAirplaySpeaker = async (_peer: Peer) => {
  await startAirplaySpeakerDetection();
  return getDetectedAirplaySpeakers();
};
