import { AudioWorkletProcessor } from 'audioworklet';

class NodeAudioworklet extends AudioWorkletProcessor {
  process(inputChannels: Int16Array[]) {
    const isMono = inputChannels.length === 1;
    // we need interleaved samples for the encoded stream
    const interleaved = new Int16Array(inputChannels[0].length * 2);
    for (let sample = 0; sample < inputChannels[0].length; sample++) {
      interleaved[sample * 2] = inputChannels[0][sample];
      // TODO: in the future, we should use dynamic channel count
      if (isMono) {
        interleaved[(sample * 2) + 1] = inputChannels[0][sample];
      } else {
        interleaved[(sample * 2) + 1] = inputChannels[1][sample];
      }
    }

    this.port.postMessage(interleaved, [interleaved.buffer]);

    return true;
  }
}

export default NodeAudioworklet;
