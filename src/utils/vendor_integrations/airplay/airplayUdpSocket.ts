/* eslint-disable no-bitwise */
import dgram from 'dgram';
import { TypedEmitter } from 'tiny-typed-emitter';

const RTP_HEADER_A_EXTENSION = 0x10;
const RTP_HEADER_A_SOURCE = 0x0f;
const RTP_HEADER_B_PAYLOAD_TYPE = 0x7f;
const RTP_HEADER_B_MARKER = 0x80;
const RTP_HEADER_LENGTH = 4;
const RTP_NTP_TIMESTAMP_LENGTH = 8;

type RTP_HEADER = ReturnType<AirplayUdpSocket['parseRtpHeader']>;

export enum RTP_PAYLOAD_TYPES {
  timingRequest = 0x52,
  timingResponse = 0x53,
  sync = 0x54,
  rangeResend = 0x55,
  audioData = 0x60,
}

interface UpdSocketEvents {
  message: (message: Buffer) => any;
  timingRequest: (message: ReturnType<AirplayUdpSocket['packetParsers']['timingRequest']>, header: RTP_HEADER) => any;
}

export class AirplayUdpSocket extends TypedEmitter<UpdSocketEvents> {
  serverPort = -1;
  clientPort = -1; // needs to be set to the correct port before responding to messages
  socket = dgram.createSocket('udp4');

  constructor(public clientHost: string) {
    super();
    this.socket.on('message', (message) => {
      const header = this.parseRtpHeader(message);
      const parsedMessage = this.packetParsers[header.payloadType]?.(message);
      this.emit(header.payloadType, parsedMessage, header);
      this.emit('message', message);
    });
  }

  async bindToPort(basePort: number) {
    this.serverPort = basePort;
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
      this.socket.bind(this.serverPort);
      try {
        await promise;
        break;
      } catch (e) {
        if (e.code !== 'EADDRINUSE') {
          throw e;
        }
        this.serverPort += 1;
      }
    }
  }

  private parseRtpHeader(message: Buffer) {
    const dataView = new DataView(message.buffer);
    const headerData = {
      a: dataView.getUint8(0),
      b: dataView.getUint8(1),
      seqnum: dataView.getUint16(2),
    };
    const header = {
      extension: Boolean(headerData.a & RTP_HEADER_A_EXTENSION),
      source: headerData.a & RTP_HEADER_A_SOURCE,
      payloadType: RTP_PAYLOAD_TYPES[String(headerData.b & RTP_HEADER_B_PAYLOAD_TYPE)],
      marker: Boolean(headerData.b & RTP_HEADER_B_MARKER),
      seqnum: headerData.seqnum,
    };
    return header;
  }
  private getRtpHeader(header: RTP_HEADER) {
    const data = new Uint8Array(RTP_HEADER_LENGTH);
    const dv = new DataView(data.buffer);
    const a = (header.extension ? RTP_HEADER_A_EXTENSION : 0) | header.source;
    const b = (header.marker ? RTP_HEADER_B_MARKER : 0) | Number(header.payloadType);
    dv.setUint8(0, a);
    dv.setUint8(1, b);
    dv.setUint16(2, header.seqnum);
    return data;
  }

  private parseNtpTimestamp = (ntpTime: ArrayBuffer) => {
    const dv = new DataView(ntpTime);
    const parsed = {
      integer: dv.getUint32(0),
      fraction: dv.getUint32(4),
    };
    return (parsed.fraction + (parsed.fraction / 2 ** 32)) * 1000;
  }
  private getNtpTimestamp = (time: number) => {
    const data = new Uint8Array(RTP_NTP_TIMESTAMP_LENGTH);
    const dv = new DataView(data.buffer);
    const integer = Math.floor(time / 1000);
    const fraction = ((time / 1000) - integer) * (2 ** 32);
    dv.setUint32(0, integer);
    dv.setUint32(4, fraction);
    return data;
  }

  private packetParsers = {
    timingRequest: (message: Buffer) => {
      const parsed = {
        referenceTime: this.parseNtpTimestamp(message.buffer.slice(RTP_HEADER_LENGTH + 4)),
        receivedTime: this.parseNtpTimestamp(message.buffer.slice(RTP_HEADER_LENGTH + 4 + RTP_NTP_TIMESTAMP_LENGTH)),
        sendTime: this.parseNtpTimestamp(message.buffer.slice(RTP_HEADER_LENGTH + 4 + RTP_NTP_TIMESTAMP_LENGTH + RTP_NTP_TIMESTAMP_LENGTH)),
      };
      return parsed;
    },
  }

  packetSender = {
    timingResponse: (originalPacket: ReturnType<AirplayUdpSocket['packetParsers']['timingRequest']>, originalPacketHeader: RTP_HEADER, currentTime: number) => {
      if (this.clientPort === -1) {
        return;
      }
      const data = new Uint8Array(RTP_HEADER_LENGTH + 4 + (3 * RTP_NTP_TIMESTAMP_LENGTH));
      const header = this.getRtpHeader({
        ...originalPacketHeader,
        payloadType: RTP_PAYLOAD_TYPES.timingResponse,
      });
      data.set(header);
      data.set(this.getNtpTimestamp(originalPacket.sendTime), RTP_HEADER_LENGTH + 4);
      data.set(this.getNtpTimestamp(currentTime), RTP_HEADER_LENGTH + 4 + RTP_NTP_TIMESTAMP_LENGTH);
      data.set(this.getNtpTimestamp(currentTime), RTP_HEADER_LENGTH + 4 + RTP_NTP_TIMESTAMP_LENGTH + RTP_NTP_TIMESTAMP_LENGTH);
      this.socket.send(data, this.clientPort, this.clientHost);
    },
  }
}
