import EventEmitter from 'events';
import bonjour from 'bonjour';
import { destructuredPromise } from '../utils/promise';

const detectorEvents = new EventEmitter();
let detector: bonjour.Browser;

export const publishService = (port) => {
  const service = bonjour().publish({
    name: 'soundsync',
    port: port,
    type: 'soundsync'
  });
}

export const startDetection = () => {
  detector = bonjour().find({
    type: 'soundsync',
  });

  detector.on('up', () => detectorEvents.emit('update'));
  detector.on('down', () => detectorEvents.emit('update'));
}

export const onDetectionChange = (handler: (services: bonjour.Service[]) => any)=> {
  detectorEvents.on('update', () => handler(detector.services));
}

export const getDetectedCoordinators = () => detector.services;


let [waitForCoordinatorSelectionPromise, selectCoordinator] = destructuredPromise();
export const waitForCoordinatorSelection = () => waitForCoordinatorSelectionPromise;

export const actAsCoordinator = () => selectCoordinator({isCoordinator: true});
export const actAsClientOfCoordinator = (coordinatorHost) => selectCoordinator({isCoordinator: false, coordinatorHost});

