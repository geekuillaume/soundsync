/* eslint-disable no-bitwise */
import dgram from 'dgram';
import crypto from 'crypto';
import { TypedEmitter } from 'tiny-typed-emitter';
import { FRAMES_PER_PACKET, SAMPLE_RATE } from './airplayConstants';
import { now } from '../../misc';

const RTP_HEADER_A_EXTENSION = 0x10;
const RTP_HEADER_A_SOURCE = 0x0f;
const RTP_HEADER_B_PAYLOAD_TYPE = 0x7f;
const RTP_HEADER_B_MARKER = 0x80;
const RTP_HEADER_LENGTH = 4;
const RTP_NTP_TIMESTAMP_LENGTH = 8;

type RTP_HEADER = ReturnType<AirplayUdpSocket['parseRtpHeader']>;
type TypedArray = Int8Array |
  Uint8Array |
  Int16Array |
  Uint16Array |
  Int32Array |
  Uint32Array |
  Uint8ClampedArray |
  Float32Array |
  Float64Array;

export enum RTP_PAYLOAD_TYPES {
  timingRequest = 0x52,
  timingResponse = 0x53,
  sync = 0x54,
  rangeResend = 0x55,
  audioData = 0x60,
}

interface UpdSocketEvents {
  message: (message: any, header: RTP_HEADER) => any;
  timingRequest: (message: ReturnType<AirplayUdpSocket['packetParsers']['timingRequest']>, header: RTP_HEADER) => any;
}

export class AirplayUdpSocket extends TypedEmitter<UpdSocketEvents> {
  serverPort = -1;
  clientPort = -1; // needs to be set to the correct port before responding to messages
  socket = dgram.createSocket('udp4');

  constructor(public clientHost: string) {
    super();
    this.socket.on('message', (message, remote) => {
      if (this.clientPort === -1) {
        this.clientPort = remote.port;
      }
      const header = this.parseRtpHeader(message);
      const parsedMessage = this.packetParsers[header.payloadType]?.(message);
      this.emit(header.payloadType, parsedMessage, header);
      this.emit('message', parsedMessage, header);
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

  stop() {
    this.socket.close();
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
    return (parsed.integer + (parsed.fraction / 2 ** 32)) * 1000;
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
        raw: message,
      };
      return parsed;
    },
    rangeResend: (message: Buffer) => ({
      missedSeq: message.readUInt16BE(RTP_HEADER_LENGTH),
      missedCount: message.readUInt16BE(RTP_HEADER_LENGTH + 2),
    }),
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
      header[0] = 0x80;
      data.set(header);
      data.set(originalPacket.raw.slice(RTP_HEADER_LENGTH + 4 + RTP_NTP_TIMESTAMP_LENGTH + RTP_NTP_TIMESTAMP_LENGTH), RTP_HEADER_LENGTH + 4);
      data.set(this.getNtpTimestamp(currentTime), RTP_HEADER_LENGTH + 4 + RTP_NTP_TIMESTAMP_LENGTH);
      data.set(this.getNtpTimestamp(currentTime), RTP_HEADER_LENGTH + 4 + RTP_NTP_TIMESTAMP_LENGTH + RTP_NTP_TIMESTAMP_LENGTH);
      this.socket.send(data, this.clientPort, this.clientHost);
    },
    audioData: (audioData: TypedArray, timestamp: number, firstPacketInStream: boolean, clientSessionId: number, aesKey?: Buffer, aesIv?: Buffer) => {
      if (this.clientPort === -1) {
        return;
      }
      if (aesKey) {
        const cipher = crypto.createCipheriv('aes-128-cbc', aesKey, aesIv);
        cipher.setAutoPadding(false);
        audioData = Buffer.concat([cipher.update(audioData), cipher.final()]);
      }

      const data = new Uint8Array(RTP_HEADER_LENGTH + 4 /* timestamp */ + 4 /* clientSessionId */ + audioData.byteLength);
      const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
      data[0] = 0x80;
      data[1] = firstPacketInStream ? 0xe0 : 0x60;
      dv.setUint16(2, Math.floor(timestamp / FRAMES_PER_PACKET));
      dv.setUint32(4, timestamp);
      dv.setUint32(8, clientSessionId);
      // we need to cast to a uint8array to force the byte-per-byte copy of the data instead of the typedarray element per element copy which result in the cast from uint16 to uint8
      data.set(new Uint8Array(audioData.buffer, audioData.byteOffset, audioData.byteLength), 12);
      this.socket.send(data, this.clientPort, this.clientHost);
    },
    sync: (currentTimestamp: number, latencySamples: number, isFirst: boolean) => {
      if (this.clientPort === -1) {
        return;
      }
      const data = new Uint8Array(RTP_HEADER_LENGTH + (Uint32Array.BYTES_PER_ELEMENT * 4));
      const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
      const header = this.getRtpHeader({
        payloadType: RTP_PAYLOAD_TYPES.sync,
        marker: true,
        seqnum: 4,
        extension: isFirst,
        source: 0,
      });
      header[0] = isFirst ? 0x90 : 0x80;
      header[1] = 0xd4;
      data.set(header);
      dv.setUint32(RTP_HEADER_LENGTH, currentTimestamp); // timestamp which should currently be coming out of the speakers
      data.set(this.getNtpTimestamp(now()), RTP_HEADER_LENGTH + Uint32Array.BYTES_PER_ELEMENT); // send time, same value as in the time packets
      dv.setUint32(RTP_HEADER_LENGTH + Uint32Array.BYTES_PER_ELEMENT * 3, currentTimestamp + latencySamples); // current timestamp + latency

      this.socket.send(data, this.clientPort, this.clientHost);
    },
  }
}
