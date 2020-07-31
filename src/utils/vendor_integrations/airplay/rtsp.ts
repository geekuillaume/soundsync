import net from 'net';
import debug from 'debug';
import { TypedEmitter } from 'tiny-typed-emitter';
import { randomBytes } from 'crypto';
import { randomBase64 } from '../../misc';

const log = debug(`soundsync:rtsp`);


interface RtspSocketEvents {
  'message': (response: RtspResponse) => void;
}
interface RtspResponse {
  code: number;
  status: string;
  headers: {[name: string]: string};
  body: string;
}

const RTSP_REQUEST_DELIMITER = `\r\n\r\n`;
const USER_AGENT = 'Soundsync';
const FRAMES_PER_PACKET = 352;

export class RtspSocket extends TypedEmitter<RtspSocketEvents> {
  socket: net.Socket;
  private requestsQueue: {resolve: (any) => any; reject: (any) => any; body: string }[] = [];
  private socketOutputBuffer = '';
  private sequenceCounter = 1;
  // eslint-disable-next-line no-bitwise
  private announceId = Math.floor(Math.random() * (2 ** 32));
  private onResponseCallback: (response: RtspResponse) => any;

  // aesKey = randomBytes(256).toString('base64').replace(/=/g, '');
  aesKey = 'VjVbxWcmYgbBbhwBNlCh3K0CMNtWoB844BuiHGUJT51zQS7SDpMnlbBIobsKbfEJ3SCgWHRXjYWf7VQWRYtEcfx7ejA8xDIk5PSBYTvXP5dU2QoGrSBv0leDS6uxlEWuxBq3lIxCxpWO2YswHYKJBt06Uz9P2Fq2hDUwl3qOQ8oXb0OateTKtfXEwHJMprkhsJsGDrIc5W5NJFMAo6zCiM9bGSDeH2nvTlyW6bfI/Q0v0cDGUNeY3ut6fsoafRkfpCwYId+bg3diJh+uzw5htHDyZ2sN+BFYHzEfo8iv4KDxzeya9llqg6fRNQ8d5YjpvTnoeEQ9ye9ivjkBjcAfVw';
  aesIv = randomBytes(16).toString('base64').replace(/=/g, '');

  constructor(public host: string, public port: number, public getRtpSequenceCounter: () => number) {
    super();
  }

  async handshake(udpControlPort: number, udpTimingPort: number) {
    await new Promise((resolve, reject) => {
      log(`Connecting to ${this.host}:${this.port}`);
      this.socket = net.connect(this.port, this.host);
      this.socket.once('error', reject);
      this.socket.once('connect', () => {
        log(`Connected`);
        this.socket.off('error', reject);
        resolve();
      });
      this.socket.on('data', this._handleData);
    });

    await this.sendRequest('OPTIONS', '*', null, [`Apple-Challenge: ${randomBase64(16)}`]);
    const announceBody = [
      `v=0`,
      `o=iTunes ${this.announceId} O IN IP4 ${(this.socket.address() as net.AddressInfo).address}`,
      `s=iTunes`,
      `c=IN IP4 ${this.host}`,
      `t=0 0`,
      `m=audio 0 RTP/AVP 96`,
      `a=rtpmap:96 AppleLossless`,
      `a=fmtp:96 ${FRAMES_PER_PACKET} 0 16 40 10 14 2 255 0 0 44100`,
      `a=rsaaeskey:${this.aesKey}`,
      `a=aesiv:${this.aesIv}`,
    ].join(`\r\n`);
    await this.sendRequest('ANNOUNCE', null, announceBody, ['Content-Type: application/sdp']);
    const res = await this.sendRequest('SETUP', null, null, [`Transport: RTP/AVP/UDP;unicast;interleaved=0-1;mode=record;control_port=${udpControlPort};timing_port=${udpTimingPort}`]);
    const [, serverPort] = res.headers.Transport.match(/;server_port=(\d+)/);
    const [, timingPort] = res.headers.Transport.match(/;timing_port=(\d+)/);
    const [, controlPort] = res.headers.Transport.match(/;control_port=(\d+)/);
    await this.sendRequest('RECORD', null, null, [this.getRtpHeader()]);
    await this.sendRequest('SET_PARAMETER', null, null, ['Content-Type: text/parameters']);
    return {
      serverPort: Number(serverPort),
      timingPort: Number(timingPort),
      controlPort: Number(controlPort),
    };
  }

  sendRequest(method: string, uri?: string, body?: string, additionalHeaders: string[] = []) {
    let requestBody = this._makeHeader(method, uri, [
      ...additionalHeaders,
      body && `Content-Length: ${body.length}`,
    ]);
    if (body) {
      requestBody += `\r\n\r\n${body}`;
    }
    const promise = new Promise<RtspResponse>((resolve, reject) => {
      this.requestsQueue.push({
        body: requestBody,
        resolve,
        reject,
      });
    });
    this._flushRequestQueue();
    return promise;
  }

  private async _flushRequestQueue() {
    if (!this.requestsQueue.length || this.onResponseCallback) {
      return;
    }
    const request = this.requestsQueue.splice(0, 1)[0];
    log(`Sending`, request.body);
    this.socket.write(request.body);
    this.socket.write(`\r\n\r\n`);
    // TODO: implement timeout
    this.onResponseCallback = (body) => {
      this.onResponseCallback = null;
      if (body.code >= 400) {
        const err = new Error(`RTSP error: status code ${body.code}`);
        // @ts-ignore
        err.body = body;
        request.reject(err);
      } else {
        request.resolve(body);
      }
    };
  }

  private _handleData = (data: Buffer) => {
    this.socketOutputBuffer = `${this.socketOutputBuffer}${data.toString()}`;
    while (this.socketOutputBuffer.indexOf(RTSP_REQUEST_DELIMITER) !== -1) {
      const delimiterIndex = this.socketOutputBuffer.indexOf(RTSP_REQUEST_DELIMITER);
      const body = this.socketOutputBuffer.slice(0, delimiterIndex);
      this.socketOutputBuffer = this.socketOutputBuffer.slice(delimiterIndex + RTSP_REQUEST_DELIMITER.length);
      const parsedResponse = this.parseResponse(body);
      if (this.onResponseCallback) {
        this.onResponseCallback(parsedResponse);
      }
      this.emit('message', parsedResponse);
    }
  }

  private _makeHeader(method: string, uri?: string, additionalHeaders?: string[]) {
    const targetUri = uri || `rtsp://${(this.socket.address() as net.AddressInfo).address}/${this.announceId}`;
    const headLines = [
      `${method} ${targetUri} RTSP/1.0`,
      `CSeq: ${this.sequenceCounter}`,
      `User-Agent: ${USER_AGENT}`,
      `DACP-ID: ${this.announceId}`,
      `Client-Instance: ${this.announceId}`,
      ...additionalHeaders.filter(Boolean),
    ];
    // if (this.session) {
    //   headLines.push(`Session: ${this.session}`);
    // }
    // if (di) {
    //   const ha1 = md5(`${di.username}:${di.realm}:${di.password}`);
    //   const ha2 = md5(`${method}:${uri}`);
    //   const diResponse = md5(`${ha1}:${di.nonce}:${ha2}`);

    //   head += `${'Authorization: Digest '
    //   + 'username="'}${di.username}", `
    //   + `realm="${di.realm}", `
    //   + `nonce="${di.nonce}", `
    //   + `uri="${uri}", `
    //   + `response="${diResponse}"\r\n`;
    // }

    this.sequenceCounter++;
    return headLines.join(`\r\n`);
  }

  private getRtpHeader() {
    const sequenceCounter = this.getRtpSequenceCounter();
    return `RTP-Info: seq=${sequenceCounter};rtptime=${sequenceCounter * FRAMES_PER_PACKET}`;
  }

  private parseResponse(data: string): RtspResponse {
    const [header, body] = data.split('\r\n\r\n');
    const lines = header.split('\r\n');

    const codeRes = /(\w+)\/(\S+) (\d+) (.*)/.exec(lines[0]);
    if (!codeRes) {
      return {
        code: 599,
        status: `Unexpected ${lines[0]}`,
        headers: {},
        body: '',
      };
    }
    return {
      code: parseInt(codeRes[3], 10),
      status: codeRes[4],
      headers: Object.fromEntries(lines.slice(1).map((line) => {
        const [, name, value] = /([^:]+):\s*(.*)/.exec(line);
        return [name, value];
      })),
      body,
    };
  }
}
