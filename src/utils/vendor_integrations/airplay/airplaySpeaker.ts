/* eslint-disable no-continue */
import { RtspSocket } from './rtsp';
import { AirplayUdpSocket } from './airplayUdpSocket';
import { AlacEncoder } from '../../alac_vendor/alacEncoder';
import {
  SAMPLE_RATE, FRAMES_PER_PACKET, CHANNELS, ALAC_HEADER_SIZE,
} from './airplayConstants';
import { MAX_LATENCY } from '../../constants';

// To prevent negative timestamps, we add [MAX_LATENCY]ms to every timestamp sent to the Airplay speaker
const MARGIN_FRAMES = MAX_LATENCY * (SAMPLE_RATE / 1000);

export class AirplaySpeaker {
  private rtspSocket: RtspSocket;
  private controlSocket: AirplayUdpSocket;
  private timingSocket: AirplayUdpSocket;
  private audioSocket: AirplayUdpSocket;
  private started = false;
  private encoder = new AlacEncoder(FRAMES_PER_PACKET, SAMPLE_RATE, 16, CHANNELS);
  public lastSentSampleTimestamp = -1;

  // this buffer is used to align to [FRAMES_PER_PACKET * CHANNELS] samples every pushed audio chunk
  private buffer = new Int16Array(FRAMES_PER_PACKET * CHANNELS);
  private bufferLength = 0;

  private firstPacket = true; // needed to send a different audio packet type when it's the first in the stream
  private samplesSinceLastSync = 0; // is used to send a SYNC packet every second

  constructor(
    public host: string,
    public port: number,
    public getCurrentTime: () => number,
    public latency: number,
  ) {
  }

  // we add MAX_LATENCY to every currentSample to prevent negative values when stream is starting
  getCurrentSampleTimestampWithMargin = () => Math.floor(this.getCurrentTime() * (SAMPLE_RATE / 1000)) + MARGIN_FRAMES

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
      this.getCurrentSampleTimestampWithMargin,
    );
    this.controlSocket = new AirplayUdpSocket(this.host);
    this.timingSocket = new AirplayUdpSocket(this.host);
    this.audioSocket = new AirplayUdpSocket(this.host);
    this.controlSocket.on('message', (message, header) => {
      // TODO: handle chunk resend message
      console.log('Received from control socket', message, header);
    });
    this.timingSocket.on('timingRequest', (request, header) => {
      const currentTimestamp = (this.getCurrentSampleTimestampWithMargin() / SAMPLE_RATE) * 1000;
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
  }

  async stop() {
    if (!this.started) {
      return;
    }
    this.started = false;
    await this.rtspSocket.stop();
    this.controlSocket.stop();
    this.timingSocket.stop();
  }

  setPushTimestamp(timestamp: number) {
    this.lastSentSampleTimestamp = timestamp + MARGIN_FRAMES;
  }

  pushAudioChunk(chunk: Int16Array) {
    if (this.lastSentSampleTimestamp === -1) {
      return;
    }
    while ((this.bufferLength + chunk.length) / CHANNELS >= FRAMES_PER_PACKET) {
      // console.log(`Pushing ${this.lastSentSampleTimestamp}, buffer length: ${chunk.length + this.bufferLength}`);
      if (this.samplesSinceLastSync > SAMPLE_RATE) { // every second send a sync packet
        this.sendSync(this.firstPacket);
        this.samplesSinceLastSync = 0;
      }

      let packetSamples: Int16Array;
      if (this.bufferLength !== 0) {
        this.buffer.set(chunk.subarray(0, (FRAMES_PER_PACKET * CHANNELS) - this.bufferLength), this.bufferLength);
        chunk = chunk.subarray((FRAMES_PER_PACKET * CHANNELS) - this.bufferLength);
        packetSamples = this.buffer;
        this.bufferLength = 0;
      } else {
        packetSamples = chunk.subarray(0, FRAMES_PER_PACKET * CHANNELS);
        chunk = chunk.subarray(FRAMES_PER_PACKET * CHANNELS);
      }
      // if (packetSamples.length / CHANNELS !== FRAMES_PER_PACKET) {
      //   throw new Error('HERE');
      // }
      // console.log(`chunk size: ${packetSamples.length / CHANNELS} - ${this.lastSentSampleTimestamp}`);

      const alacBuffer = new Uint8Array(ALAC_HEADER_SIZE + (FRAMES_PER_PACKET * CHANNELS * Int16Array.BYTES_PER_ELEMENT));
      this.encoder.encode(packetSamples, alacBuffer);
      this.audioSocket.packetSender.audioData(alacBuffer, this.lastSentSampleTimestamp, this.firstPacket, this.rtspSocket.announceId, this.rtspSocket.aesKey, this.rtspSocket.aesIv);

      this.firstPacket = false;
      this.lastSentSampleTimestamp += FRAMES_PER_PACKET;
      this.samplesSinceLastSync += FRAMES_PER_PACKET;
    }
    if (chunk.length > 0) {
      // console.log(`Filling buffer: ${chunk.length}`);
      this.buffer.set(chunk);
      this.bufferLength = chunk.length;
    }
  }

  private sendSync(isFirst: boolean) {
    const currentSampleTimestamp = this.getCurrentSampleTimestampWithMargin();
    this.controlSocket.packetSender.sync(
      currentSampleTimestamp,
      this.latency * (SAMPLE_RATE / 1000),
      isFirst,
    );
  }
}
