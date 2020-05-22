import { AudioWorkletProcessor } from 'audioworklet';

class NodeAudioworklet extends AudioWorkletProcessor {
  process(inputChannels: Int16Array[]) {
    // we need interleaved samples for the encoded stream
    const interleaved = new Int16Array(inputChannels[0].length * 2);
    for (let sample = 0; sample < inputChannels[0].length; sample++) {
      interleaved[sample * 2] = inputChannels[0][sample];
      interleaved[(sample * 2) + 1] = inputChannels[1][sample];
    }

    this.port.postMessage(interleaved, [interleaved.buffer]);

    return true;
  }
}

export default NodeAudioworklet;
