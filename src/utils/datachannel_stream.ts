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
    this.write(Buffer.from(ev.data));
  }
}
