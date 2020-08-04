/* eslint-disable no-continue */
import { RtspSocket } from './rtsp';
import { AirplayUdpSocket } from './airplayUdpSocket';
import { delay } from '../../misc';
import { AlacEncoder } from '../../alac_vendor/alacEncoder';
import {
  SAMPLE_RATE, FRAMES_PER_PACKET, CHANNELS, TIME_PER_PACKET, ALAC_HEADER_SIZE,
} from './airplayConstants';
import { MAX_LATENCY } from '../../constants';

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
    public sampleGetter: (offset: number, length: number) => Uint16Array,
  ) {
  }

  currentSampleWithMargin() {
    // we add MAX_LATENCY to every currentSample to prevent negative values when stream is starting
    return Math.floor(this.currentSampleGetter() + (MAX_LATENCY * (SAMPLE_RATE / 1000)));
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
      () => (this.currentSampleWithMargin() / SAMPLE_RATE) / FRAMES_PER_PACKET,
    );
    this.controlSocket = new AirplayUdpSocket(this.host);
    this.timingSocket = new AirplayUdpSocket(this.host);
    this.audioSocket = new AirplayUdpSocket(this.host);
    this.controlSocket.on('message', (message, header) => {
      // TODO: handle chunk resend message
      // console.log('Received from control socket', message, header);
    });
    this.timingSocket.on('timingRequest', (request, header) => {
      const currentTimestamp = (this.currentSampleWithMargin() / SAMPLE_RATE) * 1000;
      this.timingSocket.packetSender.timingResponse(request, header, currentTimestamp);
    });
    await Promise.all([
      this.controlSocket.bindToPort(5000),
      this.timingSocket.bindToPort(6000),
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
    // const hasWritten = false;
    this.lastSentSampleTimestamp = this.currentSampleWithMargin();
    // const encodedBuffer = new Uint8Array(FRAMES_PER_PACKET * CHANNELS * Uint16Array.BYTES_PER_ELEMENT + ALAC_HEADER_SIZE);
    this.sendSync(true);
    while (this.started) {
      if ((this.lastSentSampleTimestamp - (MAX_LATENCY * (SAMPLE_RATE / 1000))) + FRAMES_PER_PACKET > this.lastAvailableSampleGetter()) {
        // TODO: optimize CPU usage by sending packets in bigger chunks
        await delay(TIME_PER_PACKET);
        continue;
      }
      // this will be true once per second
      if (((this.lastSentSampleTimestamp + FRAMES_PER_PACKET) / SAMPLE_RATE) % 1 <= FRAMES_PER_PACKET / SAMPLE_RATE) {
        this.sendSync(false);
      }
      const samples = this.sampleGetter((this.lastSentSampleTimestamp - (MAX_LATENCY * (SAMPLE_RATE / 1000))) * CHANNELS, FRAMES_PER_PACKET * CHANNELS);
      // const encodedSize = this.encoder.encode(samples, encodedBuffer);
      // const encoded = encodedBuffer.subarray(0, encodedSize);
      // if (encoded.length > 300) {
      //   rawWriteStream.write(Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
      // }
      // if (!hasWritten && encoded.length > 300) {
      //   testWriteStream.write(Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength));
      //   encodedTestWriteStream.write(Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength));
      //   hasWritten = true;
      // }
      const encoded = new Uint16Array(samples.length);
      const dv = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
      samples.forEach((s, i) => {
        dv.setUint16(i * 2, s);
      });
      this.audioSocket.packetSender.audioData(new Uint8Array(encoded.buffer, encoded.byteOffset, encoded.byteLength), this.lastSentSampleTimestamp, firstPacket, this.rtspSocket.announceId, this.rtspSocket.aesKey, this.rtspSocket.aesIv);
      firstPacket = false;
      this.lastSentSampleTimestamp += FRAMES_PER_PACKET;
    }
  }

  private sendSync(isFirst: boolean) {
    const currentSample = this.currentSampleWithMargin();
    this.controlSocket.packetSender.sync(
      this.lastSentSampleTimestamp,
      (currentSample / SAMPLE_RATE) * 1000,
      22050, // TODO: better manage latency to lower it
      isFirst,
    );
  }
}
