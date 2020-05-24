import MiniPass from 'minipass';

export class DataChannelStream extends MiniPass {
  datachannel: RTCDataChannel;

  constructor(datachannel: RTCDataChannel) {
    super();
    this.datachannel = datachannel;
    datachannel.onmessage = this.handleDataChannelMessage;
    datachannel.onclose = () => {
      this.end();
    };
    this.on('end', () => {
      this.datachannel.onmessage = () => {};
      this.datachannel.close();
    });
  }

  private handleDataChannelMessage = (ev: MessageEvent) => {
    if (typeof Blob !== 'undefined' && ev.data instanceof Blob) { // Firefox create a blob that needs to be tranformed to an array buffer
      ev.data.arrayBuffer().then((b) => {
        super.write(Buffer.from(b));
      });
    } else {
      super.write(Buffer.from(ev.data));
    }
  }

  write(d: any) {
    if (this.datachannel.readyState === 'open') {
      this.datachannel.send(d);
    }
    return true;
  }
}
