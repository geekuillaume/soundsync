import { AudioWorkletProcessor } from 'audioworklet';

class NodeAudioworklet extends AudioWorkletProcessor {
  process(inputChannels: Int16Array[]) {
    // we need interleaved samples for the encoded stream
    const channelsCount = inputChannels.length;
    const samplesCount = inputChannels[0].length;
    const interleaved = new Int16Array(inputChannels[0].length * channelsCount);
    for (let channel = 0; channel < channelsCount; channel++) {
      for (let sample = 0; sample < samplesCount; sample++) {
        interleaved[(sample * channelsCount) + channel] = inputChannels[channel][sample];
      }
    }

    this.port.postMessage(interleaved, [interleaved.buffer]);

    return true;
  }
}

export default NodeAudioworklet;
