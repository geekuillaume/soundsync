import { Duplex } from 'stream';

export class DataChannelStream extends Duplex {
  datachannel: RTCDataChannel;

  constructor(datachannel: RTCDataChannel) {
    super();
    this.datachannel = datachannel;
    datachannel.onmessage = this.handleDataChannelMessage;
    datachannel.onclose = () => this.destroy();
  }

  private handleDataChannelMessage = (ev: MessageEvent) => {
    this.push(Buffer.from(ev.data));
  }

  _write(chunk, encoding, callback) {
    this.datachannel.send(chunk);
    callback(null);
  }

  // we need to wait for more data from datachannel, cannot force a read so doing nothing here
  _read() {}
}
