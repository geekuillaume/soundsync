// THIS IS A WORK IN PROGRESS
// I started implementing a mdns service file to use it a hinting service to communicate the rendez-vous uuid
// for web browsers on a network that disallow LAN DNS entries. After some testings, a lot of browsers/OS don't support
// mdns so I stopped working on this. In the future, it will still be an interesting feature to add

// /* eslint-disable no-continue */
// import debug from 'debug';
// import util from 'util';
// import os from 'os';
// import dgram from 'dgram';
// import { EventEmitter } from 'events';

// import dns, { DNSPacket, DNSRecord } from 'dns-js';

// const log = debug('soundsync:mdns');

// const DNSPacket = dns.DNSPacket;
// //var DNSRecord = dns.DNSRecord;

// const MDNS_MULTICAST = '224.0.0.251';

// interface MdnsConnections {
//   socket: dgram.Socket;
// }

// export class Mdns extends EventEmitter {
//   connections: MdnsConnections[] = [];

//   constructor() {
//     super();
//   }

//   async start() {
//     const interfaces = os.networkInterfaces();
//     const interfacesNames = Object.keys(interfaces);
//     await Promise.all(interfacesNames.map(async (interfaceName) => {
//       const addresses = interfaces[interfaceName];
//       await Promise.all(addresses.map(async (address) => {
//         if (address.internal || address.address.indexOf(':') !== -1) {
//           return;
//         }
//         await this.createSocket(address.address, 0);
//       }));
//     }));
//     await this.createSocket('0.0.0.0', 5353);
//   }

//   async createSocket(address: string, port: number) {
//     const socket = dgram.createSocket({
//       type: 'udp4',
//       reuseAddr: true,
//     });
//     socket.unref();
//     await new Promise((resolve, reject) => {
//       socket.on('error', (err) => {
//         log(`Error while binding to address ${address} and port ${port}`);
//         reject(err);
//       });
//       socket.on('listening', () => {
//         log(`Bound to address ${address} and port ${port}`);
//         resolve();
//       });
//       socket.bind(port, address);
//     });
//     if (port === 5353) {
//       socket.addMembership(MDNS_MULTICAST);
//       socket.setMulticastTTL(255);
//       socket.setMulticastLoopback(true);
//     }
//     this.connections.push({ socket });

//     socket.on('message', (message) => {
//       let packets;
//       try {
//         packets = dns.DNSPacket.parse(message);
//         if (!(packets instanceof Array)) {
//           packets = [packets];
//         }
//       } catch (er) {
//         //partial, skip it
//         // debug('packet parsing error', er);
//         return;
//       }
//       const usefulPackets = packets.filter((packet) => {
//         const questionsName = packet.question.map(({ name }) => name).filter((name) => name.includes('soundsync'));
//         return !!questionsName.length;
//       });
//       if (!usefulPackets.length) {
//         return;
//       }
//       console.log(JSON.stringify(usefulPackets, null, 2));
//     });
//   }

//   async sendRequest(name) {
//     const packet = new DNSPacket();
//     packet.question.push(new DNSRecord(name, DNSRecord.Type.ANY, 1));

//     await this.send(packet);
//   }

//   async send(packet) {
//     const buf = DNSPacket.toBuffer(packet);
//     await Promise.all(this.connections.map(async ({ socket }) => new Promise((resolve, reject) => {
//       socket.send(buf, 0, buf.length, 5353, '224.0.0.251', (err, bytes) => {
//         if (err) {
//           reject(err);
//         } else {
//           log('%s sent %d bytes with err:%s', socket.address().address, bytes, err);
//           resolve(bytes);
//         }
//       });
//     })));
//   }
// }

// const mdns = new Mdns();
// mdns.start();
// setTimeout(() => {
//   process.exit(0);
// }, 300000);
