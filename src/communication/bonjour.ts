import EventEmitter from 'events';
import bonjour from 'bonjour';
import { l } from '../utils/environment/log';
import { getLocalPeer } from './local_peer';

const log = l.extend('bonjour');

const detectorEvents = new EventEmitter();
let detector: bonjour.Browser;

export const publishService = (port) => {
  try {
    bonjour().publish({
      name: `SoundSync @ ${getLocalPeer().uuid}`,
      port,
      type: 'soundsync',
    });
  } catch (e) {
    log('Error while casting the coordinator with Bonjour', e);
  }
};

export const startDetection = () => {
  try {
    detector = bonjour().find({
      type: 'soundsync',
    });

    detector.on('up', () => detectorEvents.emit('update'));
    detector.on('down', () => detectorEvents.emit('update'));
  } catch (e) {
    log('Error while detecting coordinator on the local network');
  }
};

export const onDetectionChange = (handler: (services: bonjour.Service[]) => any) => {
  detectorEvents.on('update', () => handler(detector.services));
};

export const getDetectedCoordinators = () => detector.services;
