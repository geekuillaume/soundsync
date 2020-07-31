import { RtspSocket } from './rtsp';
import { AirplayUdpSocket } from './airplayUdpSocket';
import { now } from '../../misc';

export class AirplaySpeaker {
  rtspSocket: RtspSocket;
  controlSocket: AirplayUdpSocket;
  timingSocket: AirplayUdpSocket;
  sequenceCounter = 0;

  constructor(public host: string, public port: number) {
    this.rtspSocket = new RtspSocket(host, port, () => this.sequenceCounter);
    this.controlSocket = new AirplayUdpSocket(5000, host);
    this.timingSocket = new AirplayUdpSocket(6000, host);
    this.controlSocket.on('message', (message) => {
      console.log('Received from control socket', message);
    });
    this.timingSocket.on('timingRequest', (request, header) => {
      this.timingSocket.packetSender.timingResponse(request, header, now());
    });
  }

  async start() {
    await Promise.all([
      this.controlSocket.setup(),
      this.timingSocket.setup(),
    ]);
    const ports = await this.rtspSocket.handshake(this.controlSocket.port, this.timingSocket.port);
    this.controlSocket.clientPort = ports.controlPort;
    this.timingSocket.clientPort = ports.timingPort;
  }
}


const testDevice = new AirplaySpeaker('127.0.0.1', 5000);
testDevice.start();

setTimeout(() => {
  process.exit(0);
}, 300000);
