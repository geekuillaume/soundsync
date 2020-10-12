const checks = [
  {check: typeof window.RTCPeerConnection !== undefined, message: "WebRTC is not supported"},
  {check: typeof localStorage !== undefined, message: "LocalStorage is not supported"},
  {check: typeof WebAssembly !== undefined, message: "WebAssembly is not supported"},
  {check: typeof WebAssembly.instantiate !== undefined, message: "WebAssembly.instantiate is not supported"},
  {check: () => new window.RTCPeerConnection, message: "WebRTC is blocked, check your extensions"},
];

export const hasNecessaryApi = () => {
  for (const check of checks) {
    if (typeof check.check === 'boolean') {
      if (check.check === false) {
        return {error: true, message: check.message};
      }
    } else {
      try {
        check.check();
      } catch (e) {
        return {error: true, message: check.message};
      }
    }
  }

  return {error: false};
}
