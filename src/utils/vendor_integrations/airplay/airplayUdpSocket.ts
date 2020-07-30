import dgram from 'dgram';

export class AirplayUdpSocket {
  port: number;
  socket: dgram.Socket;

  constructor(public basePort: number) {}
  async setup() {
    this.socket = dgram.createSocket('udp4');

    this.port = this.basePort;
    // this is used to find a available port, we continue until we can listen to a port
    while (true) {
      const promise = new Promise((resolve, reject) => {
        const errorHandler = (err) => {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          this.socket.off('listening', listeningHandler);
          reject(err);
        };
        const listeningHandler = () => {
          this.socket.off('error', errorHandler);
          resolve();
        };
        this.socket.once('error', errorHandler);
        this.socket.once('listening', listeningHandler);
      });
      this.socket.bind(this.port);
      try {
        await promise;
        break;
      } catch (e) {
        if (e.code !== 'EADDRINUSE') {
          throw e;
        }
        this.port += 1;
      }
    }
  }
}
