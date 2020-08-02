/* eslint-disable no-continue */
import { RtspSocket } from './rtsp';
import { AirplayUdpSocket } from './airplayUdpSocket';
import { delay } from '../../misc';
import { AlacEncoder } from '../../alac_vendor/alacEncoder';
import {
  SAMPLE_RATE, FRAMES_PER_PACKET, CHANNELS, TIME_PER_PACKET,
} from './airplayConstants';

export class AirplaySpeaker {
  private rtspSocket: RtspSocket;
  private controlSocket: AirplayUdpSocket;
  private timingSocket: AirplayUdpSocket;
  private audioSocket: AirplayUdpSocket;
  private sequenceCounter = 0;
  private started = false;
  private encoder = new AlacEncoder();

  constructor(public host: string, public port: number, public currentSampleGetter: () => number, public sampleGetter: (offset: number, length: number) => Uint16Array) {
    this.rtspSocket = new RtspSocket(host, port, () => this.sequenceCounter);
    this.controlSocket = new AirplayUdpSocket(host);
    this.timingSocket = new AirplayUdpSocket(host);
    this.audioSocket = new AirplayUdpSocket(host);
    this.controlSocket.on('message', (message) => {
      console.log('Received from control socket', message);
    });
    this.timingSocket.on('timingRequest', (request, header) => {
      const currentTimestamp = Math.max(0, this.currentSampleGetter() / SAMPLE_RATE);
      this.timingSocket.packetSender.timingResponse(request, header, currentTimestamp);
    });
  }

  async start() {
    if (this.started) {
      return;
    }
    this.started = true;
    await AlacEncoder.initPromise;
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

  private async audioPusher() {
    let firstPacket = true;
    let lastSentSampleTimestamp = Math.max(0, this.currentSampleGetter()); // cap to prevent negative values
    const encodedBuffer = new Uint8Array(FRAMES_PER_PACKET * CHANNELS * Uint16Array.BYTES_PER_ELEMENT);
    while (true) {
      const currentSampleTimestamp = this.currentSampleGetter();
      if (lastSentSampleTimestamp + FRAMES_PER_PACKET > currentSampleTimestamp) {
        // TODO: optimize CPU usage by sending packets in bigger chunks than 2 maybe?
        await delay(TIME_PER_PACKET * 2);
        continue;
      }
      const samples = this.sampleGetter(lastSentSampleTimestamp, FRAMES_PER_PACKET * CHANNELS);
      const encodedSize = this.encoder.encode(samples, encodedBuffer);
      const encoded = encodedBuffer.subarray(0, encodedSize);
      this.audioSocket.packetSender.audioData(encoded, lastSentSampleTimestamp, firstPacket, this.rtspSocket.announceId, this.rtspSocket.aesKey, this.rtspSocket.aesIv);
      firstPacket = false;
      lastSentSampleTimestamp += FRAMES_PER_PACKET;
    }
  }
}
