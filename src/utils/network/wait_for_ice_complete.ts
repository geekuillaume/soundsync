import { ICE_GATHERING_TIMEOUT } from '../constants';
import { delay } from '../misc';

export async function waitUntilIceGatheringStateComplete(peerConnection: RTCPeerConnection) {
  if (peerConnection.iceGatheringState === 'complete') {
    return;
  }

  await Promise.race([
    delay(ICE_GATHERING_TIMEOUT),
    new Promise((resolve) => {
      peerConnection.addEventListener('icegatheringstatechange', () => {
        if (peerConnection.iceGatheringState === 'complete') {
          resolve();
        }
      });
    }),
  ]);
}
