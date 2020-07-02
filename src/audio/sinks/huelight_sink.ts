import { find, partition } from 'lodash';
import { dtls } from 'node-dtls-client';
// import beats from 'beats';
import smoothstep from 'smoothstep';

import superagent from 'superagent';
import Analyser from 'audio-analyser';

import { AudioInstance } from '../utils';
import { OPUS_ENCODER_RATE, OPUS_ENCODER_CHUNK_DURATION } from '../../utils/constants';
import { HueLightStatus, HueLightSinkDescriptor } from './sink_type';
import { AudioSink } from './audio_sink';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { getAuthentifiedApi, getHueCredentialsByHost, get2BytesOfFractionNumber } from '../../utils/philipshue';
import { delay } from '../../utils/misc';
import { AudioChunkStreamOutput } from '../../utils/chunk_stream';
import { frequencyAverages } from '../../utils/audio-utils';

const FPS = 50;

export class HueLightSink extends AudioSink {
  local: true = true;
  type: 'huelight' = 'huelight';

  hueHost: string;
  entertainmentZoneId: string;
  status: HueLightStatus = HueLightStatus.connecting;

  private closeHue;
  private hueSocket: dtls.Socket;
  private lights: {id: number; model: string; x: number; y: number}[];

  private audioBuffer = [];
  private analyser = new Analyser({
    channel: 0,
    channels: 2,
    sampleRate: OPUS_ENCODER_RATE,
    interleaved: true,
    float: true,
    fftSize: 2048,
    smoothingTimeConstant: 0.6,
    bufferSize: OPUS_ENCODER_RATE,
  });

  constructor(descriptor: HueLightSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.hueHost = descriptor.hueHost;
    this.entertainmentZoneId = descriptor.entertainmentZoneId;
    this.latency = 200;
    // this.chunkTransformer.pipe(this.peakTransformer);
  }

  async _startSink() {
    this.log('Connecting to Hue Bridge');
    const api = await getAuthentifiedApi(this.hueHost);
    const entertainmentGroup = await api.groups.getGroup(this.entertainmentZoneId);
    const lights = await api.lights.getAll();
    this.lights = entertainmentGroup.lights.map((id: string) => ({
      id: Number(id),
      model: find(lights, { _data: { id: Number(id) } }),
      // x and y goes from -1 to 1, mapping them to [0, 1]
      // @ts-ignore
      x: (entertainmentGroup.locations[id][0] + 1) / 2,
      // @ts-ignore
      y: (entertainmentGroup.locations[id][1] + 1) / 2,
      // z is ignored for now
    }));

    // Normalize all lights from 0 to 1 by taking min/max value for x/y as bounds
    const xBounds = this.lights.reduce(([min, max], { x }) => [Math.min(x, min), Math.max(x, max)], [Infinity, -Infinity]);
    const yBounds = this.lights.reduce(([min, max], { y }) => [Math.min(y, min), Math.max(y, max)], [Infinity, -Infinity]);
    this.lights.forEach((light) => {
      light.x = (light.x - xBounds[0]) * (1 / (xBounds[1] - xBounds[0]));
      light.y = (light.y - yBounds[0]) * (1 / (yBounds[1] - yBounds[0]));
    });
    const credentials = getHueCredentialsByHost(this.hueHost);
    // @ts-ignore
    await superagent.put(`http://${this.hueHost}/api/${credentials.username}/groups/${this.entertainmentZoneId}`).send({ stream: { active: true } });
    this.log('Connected to Hue Bridge, starting light pusher socket');
    this.hueSocket = dtls.createSocket({
      type: 'udp4',
      address: this.hueHost,
      port: 2100,
      // @ts-ignore
      psk: {
        [credentials.username]: Buffer.from(credentials.clientKey, 'hex'),
      },
      timeout: 5000, // in ms, optional, minimum 100, default 1000
    // ciphers: ["TLS_PSK_WITH_AES_128_GCM_SHA256"]
    });
    await new Promise((resolve, reject) => {
      this.hueSocket.on('connected', resolve);
      this.hueSocket.on('error', reject);
    });
    this.lightPusher();
    this.closeHue = async () => {
      this.closeHue = null;
      this.hueSocket.close();
      delete this.hueSocket;
      delete this.lights;
      await superagent.put(`http://${this.hueHost}/api/${credentials.username}/groups/${this.entertainmentZoneId}`).send({
        stream: { active: false },
      });
    };
  }

  lightPusher = async () => {
    const frequencies = new Uint8Array(1024);
    // const last = 0;
    // const difference = 50;
    // const rows = 15;
    // eslint-disable-next-line no-return-assign
    // const ranges = new Array(rows).fill(0).map(() => [last, last += difference]);
    const ranges = [
      [0, 50],
      [50, 200],
      [200, 500],
      [500, 1000],
      [1000, 5000],
      [5000, 1000],
    ];
    // const bins = ranges.map((range) => ({
    //   lo: freq2index(range[0], OPUS_ENCODER_RATE, 2048),
    //   hi: freq2index(range[1], OPUS_ENCODER_RATE, 2048),
    //   threshold: 0,
    //   decay: 0.001,
    // }));
    const getAverage = frequencyAverages(OPUS_ENCODER_RATE, 2048);
    // const detect = beats(bins);

    while (this.hueSocket) {
      const currentTime = this.getCurrentStreamTime();
      const [toEmitBuffer, remaining] = partition(this.audioBuffer, ({ i }) => i * OPUS_ENCODER_CHUNK_DURATION < currentTime);
      this.audioBuffer = remaining;
      toEmitBuffer.sort((a, b) => a.i - b.i);
      toEmitBuffer.forEach((buffer) => {
        this.analyser.write(buffer.chunk);
      });

      this.analyser.getByteFrequencyData(frequencies);
      // console.log(frequencies);
      // const result = detect(frequencies.map((i) => (i + 100) / 100));
      // console.log(result);
      // console.log(ranges.map((r) => getAverage(frequencies, r[0], r[1])));
      // const highFrequenciesMean = Math.min(1, 1 + (mean(analysis.slice(analysis.length - 5)) / 100));
      // const lowFrequenciesMean = Math.min(1, 1 + (mean(analysis.slice(0, 10)) / 100));
      // console.log(lowFrequenciesMean);
      const lowFrequenciesMean = smoothstep(0.4, 0.9, getAverage(frequencies, ranges[0][0], ranges[0][1]));
      const midFrequenciesMean = smoothstep(0.4, 0.9, getAverage(frequencies, ranges[2][0], ranges[2][1]));
      const highFrequenciesMean = smoothstep(0.4, 0.9, getAverage(frequencies, ranges[4][0], ranges[4][1]));
      // console.log(lowFrequenciesMean, getAverage(frequencies, ranges[0][0], ranges[0][1]));
      const message = Buffer.concat([
        Buffer.from('HueStream', 'ascii'),
        Buffer.from([
          0x01, 0x00, //version 1.0
          0x07, //sequence number 7
          0x00, 0x00, //Reserved write 0’s
          0x00, //color mode RGB
          0x00, // Reserved, write 0’s
        ]),
        // eslint-disable-next-line no-loop-func
        ...this.lights.map(({
          id, model, x, y,
        }) => {
          const c = { r: lowFrequenciesMean, g: midFrequenciesMean, b: highFrequenciesMean };
          return Buffer.from([
            0x00, 0x00, id, // Light ID
            ...get2BytesOfFractionNumber(c.r), ...get2BytesOfFractionNumber(c.g), ...get2BytesOfFractionNumber(c.b),
          ]);
        }),
      ]);
      await new Promise((resolve) => {
        this.hueSocket.send(message, resolve);
      });
      await delay(1000 / FPS);
    }
  }

  _stopSink = async () => {
    if (this.closeHue) {
      await this.closeHue();
    }
  }
  handleAudioChunk = (data: AudioChunkStreamOutput) => {
    this.audioBuffer.push(data);
  }

  toDescriptor = (sanitizeForConfigSave = false): AudioInstance<HueLightSinkDescriptor> => ({
    type: this.type,
    name: this.name,
    uuid: this.uuid,
    pipedFrom: this.pipedFrom,
    volume: this.volume,

    hueHost: this.hueHost,
    status: this.status,
    entertainmentZoneId: this.entertainmentZoneId,
    ...(!sanitizeForConfigSave && {
      peerUuid: this.peerUuid,
      instanceUuid: this.instanceUuid,
      latency: this.latency,
      available: this.available,
    }),
  })
}
