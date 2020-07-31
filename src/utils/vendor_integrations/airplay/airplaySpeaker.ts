import { RtspSocket } from './rtsp';
import { AirplayUdpSocket } from './airplayUdpSocket';

// Inspired by https://github.com/afaden/node_airtunes

export const SAMPLE_RATE = 44100;
export const CHANNELS = 2;

export class AirplaySpeaker {
  rtspSocket: RtspSocket;
  controlSocket: AirplayUdpSocket;
  timingSocket: AirplayUdpSocket;
  audioSocket: AirplayUdpSocket;
  sequenceCounter = 0;

  constructor(public host: string, public port: number, public currentSampleGetter: () => number, public sampleGetter: (offset: number, length: number) => Float32Array) {
    this.rtspSocket = new RtspSocket(host, port, () => this.sequenceCounter);
    this.controlSocket = new AirplayUdpSocket(host);
    this.timingSocket = new AirplayUdpSocket(host);
    this.audioSocket = new AirplayUdpSocket(host);
    this.controlSocket.on('message', (message) => {
      console.log('Received from control socket', message);
    });
    this.timingSocket.on('timingRequest', (request, header) => {
      this.timingSocket.packetSender.timingResponse(request, header, this.currentSampleGetter() / SAMPLE_RATE);
    });
  }

  async start() {
    await Promise.all([
      this.controlSocket.bindToPort(5000),
      this.timingSocket.bindToPort(6000),
    ]);
    const ports = await this.rtspSocket.handshake(this.controlSocket.serverPort, this.timingSocket.serverPort);
    this.controlSocket.clientPort = ports.controlPort;
    this.timingSocket.clientPort = ports.timingPort;
    this.audioSocket.clientPort = ports.serverPort;
  }
}


// const testDevice = new AirplaySpeaker(
//   '127.0.0.1',
//   5000,
//   () => now(),
//   (offset, length) => new Float32Array(length));
// testDevice.start();

// setTimeout(() => {
//   process.exit(0);
// }, 300000);
