import { AudioServer } from 'audioworklet';

const SAMPLE_RATE = 48000;
const CHANNELS = 2;

let position = 0;
const channelsLastPeakEnd = [];
const process = (data: Float32Array) => {
  for (let channel = 0; channel < CHANNELS; channel++) {
    for (let sampleIndex = 0; sampleIndex < data.length / CHANNELS; sampleIndex++) {
      const sample = channel[(sampleIndex * CHANNELS) + channel];
      if (Math.abs(sample) > 0.3) {
        channelsLastPeakEnd[channel] = position + sampleIndex;
      }
    }
  }

  position += data.length / CHANNELS;
  return true;
};

const main = async () => {
  const server = new AudioServer();
  console.log(server.getDefaultInputDevice());
  const stream = server.initInputStream(server.getDefaultInputDevice().id, {
    channels: 2,
    sampleRate: SAMPLE_RATE,
    format: AudioServer.F32LE,
  });
  stream.start();

  stream.registerReadHandler(process);

  const logPeaks = () => {
    const diffMs = (channelsLastPeakEnd[0] - channelsLastPeakEnd[1]) / (SAMPLE_RATE / 1000);
    if (Math.abs(diffMs) > 400) {
      setTimeout(logPeaks, 100);
      return;
    }
    channelsLastPeakEnd.forEach((lastPeakEnd, channelIndex) => {
      console.log(`Channel ${channelIndex}, lastPeakEnd: ${lastPeakEnd}`);
    });
    console.log(`Diff: ${diffMs}ms`);
    setTimeout(logPeaks, 1000);
  };
  setTimeout(logPeaks, 1000);
};

main();
