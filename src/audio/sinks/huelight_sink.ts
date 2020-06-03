import { find } from 'lodash';
import { dtls } from 'node-dtls-client';
import superagent from 'superagent';
import { AudioInstance } from '../utils';
import { HueLightStatus, HueLightSinkDescriptor } from './sink_type';
import { AudioSink } from './audio_sink';
import { AudioSourcesSinksManager } from '../audio_sources_sinks_manager';
import { getAuthentifiedApi, getHueCredentialsByHost, get2BytesOfFractionNumber } from '../../utils/philipshue';
import { delay } from '../../utils/misc';

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

  constructor(descriptor: HueLightSinkDescriptor, manager: AudioSourcesSinksManager) {
    super(descriptor, manager);
    this.hueHost = descriptor.hueHost;
    this.entertainmentZoneId = descriptor.entertainmentZoneId;
  }

  async _startSink() {
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
    await superagent.put(`http://${this.hueHost}/api/${credentials.username}/groups/${this.entertainmentZoneId}`).send({ stream: { active: true } });
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
    const currentLightsScene = {};
    while (this.hueSocket) {
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
          const c = currentLightsScene[id] || { r: 0.8, g: 0, b: 0 };
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

  _stopSink() {
    if (this.closeHue) {
      this.closeHue();
    }
  }
  handleAudioChunk() {}

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
