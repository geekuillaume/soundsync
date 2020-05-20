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
  }

  private handleDataChannelMessage = (ev: MessageEvent) => {
    super.write(Buffer.from(ev.data));
  }

  write(d: any) {
    if (this.datachannel.readyState === 'open') {
      this.datachannel.send(d);
    }
    return true;
  }
}
