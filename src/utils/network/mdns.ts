/* eslint-disable no-continue */
import debug from 'debug';
import util from 'util';
import os from 'os';
import dgram from 'dgram';
import { EventEmitter } from 'events';

import dns from 'dns-js';

const log = debug('soundsync:mdns');

const DNSPacket = dns.DNSPacket;
//var DNSRecord = dns.DNSRecord;

const MDNS_MULTICAST = '224.0.0.251';

interface MdnsConnections {
  socket: dgram.Socket;
}

export class Mdns extends EventEmitter {
  connections: MdnsConnections[] = [];

  constructor() {
    super();
  }

  async start() {
    const interfaces = os.networkInterfaces();
    const interfacesNames = Object.keys(interfaces);
    await Promise.all(interfacesNames.map(async (interfaceName) => {
      const addresses = interfaces[interfaceName];
      await Promise.all(addresses.map(async (address) => {
        if (address.internal || address.address.indexOf(':') !== -1) {
          return;
        }
        await this.createSocket(address.address, 0);
      }));
    }));
    await this.createSocket('0.0.0.0', 5353);
  }

  async createSocket(address: string, port: number) {
    const socket = dgram.createSocket({
      type: 'udp4',
      reuseAddr: true,
    });
    socket.unref();
    await new Promise((resolve, reject) => {
      socket.on('error', (err) => {
        log(`Error while binding to address ${address} and port ${port}`);
        reject(err);
      });
      socket.on('listening', () => {
        log(`Bound to address ${address} and port ${port}`);
        resolve();
      });
      socket.bind(port, address);
    });
    if (port === 5353) {
      socket.addMembership(MDNS_MULTICAST);
      socket.setMulticastTTL(255);
      socket.setMulticastLoopback(true);
    }

    socket.on('message', (message, remote) => {
      let packets;
      try {
        packets = dns.DNSPacket.parse(message);
        if (!(packets instanceof Array)) {
          packets = [packets];
        }
      } catch (er) {
        //partial, skip it
        // debug('packet parsing error', er);
        return;
      }
      packets.forEach((packet) => {
        const questionsName = packet.question.map(({ name }) => name).filter((name) => name.includes('soundsync.local'));
        if (questionsName.length) {
          console.log(questionsName);
        }
      });
      this.connections.push({ socket });
    });
  }

  async send(packet) {
    const buf = DNSPacket.toBuffer(packet);
    // this.connections.forEach(onEach);
    await Promise.all(this.connections.map(async ({ socket }) => new Promise((resolve, reject) => {
      socket.send(buf, 0, buf.length, 5353, '224.0.0.251', (err, bytes) => {
        if (err) {
          reject(err);
        } else {
          log('%s sent %d bytes with err:%s', socket.address().address, bytes, err);
          resolve(bytes);
        }
      });
    })));
  }
}

const mdns = new Mdns();
mdns.start();
setTimeout(() => {
  process.exit(0);
}, 300000);
