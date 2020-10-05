export const hasNecessaryApi = () => {
  if (
    typeof RTCPeerConnection === undefined ||
    typeof localStorage === undefined ||
    typeof WebAssembly === undefined ||
    typeof WebAssembly.instantiate === undefined
  ) {
    return false
  }
  return true;
}
