import net from 'net';
import debug from 'debug';
import crypto from 'crypto';
import { TypedEmitter } from 'tiny-typed-emitter';
import { promisify } from 'util';
import { randomBase64 } from '../../misc';
import { AUTH_SETUP_PUBLIC_KEY, RSA_PRIVATE_KEY } from './airplayConstants';

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
  private requestsQueue: {name: string; resolve: (any) => any; reject: (any) => any; body: Buffer }[] = [];
  private socketOutputBuffer = '';
  private sequenceCounter = 1;
  // eslint-disable-next-line no-bitwise
  announceId = Math.floor(Math.random() * (2 ** 32));
  private onResponseCallback: (response: RtspResponse) => any;

  aesKey: Buffer;
  aesIv: Buffer;

  constructor(public host: string, public port: number, public getCurrentSample: () => number) {
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
    const postBody = Buffer.concat([new Uint8Array([1]), AUTH_SETUP_PUBLIC_KEY]);
    try {
      await this.sendRequest('POST', '/auth-setup', postBody, ['Content-Type: application/octet-stream']);
    } catch (e) {
      log('POST /auth-setup returned error, ignoring');
    }
    // this.aesKey = crypto.randomBytes(16);
    // this.aesIv = crypto.randomBytes(16);
    const announceBody = [
      `v=0`,
      `o=iTunes ${this.announceId} O IN IP4 ${(this.socket.address() as net.AddressInfo).address}`,
      `s=iTunes`,
      `c=IN IP4 ${this.host}`,
      `t=0 0`,
      `m=audio 0 RTP/AVP 96`,
      // TODO: compress audio with ALAC
      `a=rtpmap:96 AppleLossless`,
      `a=fmtp:96 ${FRAMES_PER_PACKET} 0 16 40 10 14 2 255 0 0 44100`,
      // `a=rtpmap:96 L16/44100/2`,
      // TODO: check if aekKey is not supported and fallback to unencrypted stream
      ...(this.aesKey ? [
        `a=rsaaeskey:${crypto.publicEncrypt(crypto.createPrivateKey(RSA_PRIVATE_KEY), this.aesKey).toString('base64').replace(/=/g, '')}`,
        `a=aesiv:${this.aesIv.toString('base64').replace(/=/g, '')}`,
      ] : []),
    ].map((v) => `${v}\r\n`).join('');
    await this.sendRequest('ANNOUNCE', null, announceBody, ['Content-Type: application/sdp']);
    const res = await this.sendRequest('SETUP', null, null, [`Transport: RTP/AVP/UDP;unicast;interleaved=0-1;mode=record;control_port=${udpControlPort};timing_port=${udpTimingPort}`]);
    const [, serverPort] = res.headers.Transport.match(/;server_port=(\d+)/);
    const [, timingPort] = res.headers.Transport.match(/;timing_port=(\d+)/);
    const [, controlPort] = res.headers.Transport.match(/;control_port=(\d+)/);
    const recordRes = await this.sendRequest('RECORD', null, null, ['Session: 1', this.getRtpHeader()]);
    // setting volume is necessary to start stream, we set it to the minimum then the airplay sink will update the volume to the correct value
    await this.sendRequest('SET_PARAMETER', null, 'volume: -33\r\n', ['Session: 1', 'Content-Type: text/parameters']);
    return {
      serverPort: Number(serverPort),
      timingPort: Number(timingPort),
      controlPort: Number(controlPort),
      latency: Number(recordRes.headers['Audio-Latency']),
    };
  }

  stop() {
    this.socket.end();
    this.socket = null;
  }

  sendRequest(method: string, uri?: string, body?: string | Buffer, additionalHeaders: string[] = []) {
    if (!this.socket) {
      throw new Error('Socket has been deleted');
    }
    let requestBody = this._makeHeader(method, uri, [
      ...additionalHeaders,
      body && `Content-Length: ${body.length}`,
    ]);
    if (body) {
      requestBody = Buffer.concat([requestBody, Buffer.isBuffer(body) ? body : Buffer.from(body)]);
    }
    const promise = new Promise<RtspResponse>((resolve, reject) => {
      this.requestsQueue.push({
        name: method,
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
    log(`Sending`, request.body.toString());
    this.socket.write(request.body);
    // TODO: implement timeout
    this.onResponseCallback = (body) => {
      this.onResponseCallback = null;
      if (body.code >= 400) {
        const err = new Error(`RTSP error on ${request.name} - ${body.code}: ${body.body}`);
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
    return Buffer.from(`${headLines.map((v) => `${v}\r\n`).join('')}\r\n`);
  }

  private getRtpHeader() {
    const currentSample = this.getCurrentSample();
    return `RTP-Info: seq=${Math.floor(currentSample / FRAMES_PER_PACKET)};rtptime=${currentSample}`;
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
