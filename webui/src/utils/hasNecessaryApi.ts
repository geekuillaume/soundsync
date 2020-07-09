export const hasNecessaryApi = () => {
  if (
    typeof RTCPeerConnection === undefined ||
    typeof localStorage === undefined
  ) {
    return false
  }
  return true;
}
