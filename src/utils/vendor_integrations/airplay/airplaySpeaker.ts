import { RtspSocket } from './rtsp';
import { AirplayUdpSocket } from './airplayUdpSocket';

export class AirplaySpeaker {
  rtspSocket: RtspSocket;
  controlSocket = new AirplayUdpSocket(5000);
  timingSocket = new AirplayUdpSocket(6000);
  sequenceCounter = 0;

  constructor(public host: string, public port: number) {
    this.rtspSocket = new RtspSocket(host, port, () => this.sequenceCounter);
  }

  async start() {
    await Promise.all([
      this.controlSocket.setup(),
      this.timingSocket.setup(),
    ]);
    await this.rtspSocket.handshake(this.controlSocket.port, this.timingSocket.port);
  }
}


const testDevice = new AirplaySpeaker('127.0.0.1', 5000);
testDevice.start();

setTimeout(() => {
  process.exit(0);
}, 300000);
