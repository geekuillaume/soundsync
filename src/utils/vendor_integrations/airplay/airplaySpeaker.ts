/* eslint-disable no-continue */
import { RtspSocket } from './rtsp';
import { AirplayUdpSocket } from './airplayUdpSocket';
import { delay } from '../../misc';
import { AlacEncoder } from '../../alac_vendor/alacEncoder';
import {
  SAMPLE_RATE, FRAMES_PER_PACKET, CHANNELS, TIME_PER_PACKET, ALAC_HEADER_SIZE,
} from './airplayConstants';
import { MAX_LATENCY } from '../../constants';

// To prevent negative timestamps, we add MAX_LATENCYms to every timestamp sent to the Airplay speaker
const MARGIN_FRAMES = MAX_LATENCY * (SAMPLE_RATE / 1000);

export class AirplaySpeaker {
  private rtspSocket: RtspSocket;
  private controlSocket: AirplayUdpSocket;
  private timingSocket: AirplayUdpSocket;
  private audioSocket: AirplayUdpSocket;
  private started = false;
  private encoder = new AlacEncoder(FRAMES_PER_PACKET, SAMPLE_RATE, 16, CHANNELS);
  private lastSentSampleTimestamp = 0;

  constructor(
    public host: string,
    public port: number,
    public currentSampleGetter: () => number,
    public lastAvailableSampleGetter: () => number,
    public sampleGetter: (offset: number, length: number) => Int16Array,
  ) {
  }

  // we add MAX_LATENCY to every currentSample to prevent negative values when stream is starting
  getCurrentSampleWithMargin = () => Math.floor(this.currentSampleGetter() + (MAX_LATENCY * (SAMPLE_RATE / 1000)))

  async setVolume(volume: number) {
    // airplay volume minimum is -30 up to 0
    const mappedVolume = -30 + (volume * 30);
    await this.rtspSocket.sendRequest('SET_PARAMETER', null, `volume: ${mappedVolume}\r\n`, ['Session: 1', 'Content-Type: text/parameters']);
  }

  async start() {
    if (this.started) {
      return;
    }
    this.started = true;
    await AlacEncoder.initPromise;
    this.rtspSocket = new RtspSocket(
      this.host,
      this.port,
      this.getCurrentSampleWithMargin,
    );
    this.controlSocket = new AirplayUdpSocket(this.host);
    this.timingSocket = new AirplayUdpSocket(this.host);
    this.audioSocket = new AirplayUdpSocket(this.host);
    this.controlSocket.on('message', (message, header) => {
      console.log('Received from control socket', message, header);
    });
    this.timingSocket.on('timingRequest', (request, header) => {
      const currentTimestamp = (this.getCurrentSampleWithMargin() / SAMPLE_RATE) * 1000;
      this.timingSocket.packetSender.timingResponse(request, header, currentTimestamp);
    });
    await Promise.all([
      this.controlSocket.bindToPort(5000 + Math.floor(Math.random() * 1000)),
      this.timingSocket.bindToPort(6000 + Math.floor(Math.random() * 1000)),
    ]);
    const rtspInfo = await this.rtspSocket.handshake(this.controlSocket.serverPort, this.timingSocket.serverPort);
    this.controlSocket.clientPort = rtspInfo.controlPort;
    this.timingSocket.clientPort = rtspInfo.timingPort;
    this.audioSocket.clientPort = rtspInfo.serverPort;
    this.audioPusher();
  }

  stop() {
    if (!this.started) {
      return;
    }
    this.started = false;
    this.rtspSocket.stop();
    this.controlSocket.stop();
    this.timingSocket.stop();
  }

  private async audioPusher() {
    let firstPacket = true;
    this.lastSentSampleTimestamp = this.getCurrentSampleWithMargin();

    this.sendSync(true);
    while (this.started) {
      if (this.lastSentSampleTimestamp - MARGIN_FRAMES + FRAMES_PER_PACKET > this.lastAvailableSampleGetter()) {
        // TODO: optimize CPU usage by sending packets in bigger chunks
        await delay(TIME_PER_PACKET);
        continue;
      }
      // this will be true once per second
      if (((this.lastSentSampleTimestamp + FRAMES_PER_PACKET) / SAMPLE_RATE) % 1 <= FRAMES_PER_PACKET / SAMPLE_RATE) {
        this.sendSync(false);
      }
      const samples = this.sampleGetter((this.lastSentSampleTimestamp - MARGIN_FRAMES) * CHANNELS, FRAMES_PER_PACKET * CHANNELS);

      // Little to big endian conversion:
      // const dv = new DataView(samples.buffer, samples.byteOffset, samples.byteLength);
      // samples.forEach((s, i) => {
      //   if (Math.abs(s) < 10) {
      //     samples[i] = 0;
      //     // s = 0;
      //   }
      //   // dv.setInt16(i * 2, s, true);
      // });

      const alacBuffer = new Uint8Array(ALAC_HEADER_SIZE + (FRAMES_PER_PACKET * CHANNELS * Int16Array.BYTES_PER_ELEMENT));
      this.encoder.encode(samples, alacBuffer);

      this.audioSocket.packetSender.audioData(alacBuffer, this.lastSentSampleTimestamp, firstPacket, this.rtspSocket.announceId, this.rtspSocket.aesKey, this.rtspSocket.aesIv);
      firstPacket = false;
      this.lastSentSampleTimestamp += FRAMES_PER_PACKET;
    }
  }

  private sendSync(isFirst: boolean) {
    const currentSample = this.getCurrentSampleWithMargin();
    this.controlSocket.packetSender.sync(
      this.lastSentSampleTimestamp,
      (currentSample / SAMPLE_RATE) * 1000,
      22050, // TODO: better manage latency to lower it
      isFirst,
    );
  }
}
