import { ICE_GATHERING_TIMEOUT } from './constants';

export async function waitUntilIceGatheringStateComplete(peerConnection: RTCPeerConnection) {
  if (peerConnection.iceGatheringState === 'complete') {
    return;
  }

  const deferred: any = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  let timeout;
  function onIceCandidate({ candidate }) {
    if (!candidate) {
      clearTimeout(timeout);
      peerConnection.removeEventListener('icecandidate', onIceCandidate);
      deferred.resolve();
    }
  }

  timeout = setTimeout(() => {
    peerConnection.removeEventListener('icecandidate', onIceCandidate);
    deferred.reject(new Error('Timed out waiting for host candidates'));
  }, ICE_GATHERING_TIMEOUT);

  peerConnection.addEventListener('icecandidate', onIceCandidate);

  await deferred.promise;
}
