import EventEmitter from 'events';
import bonjour from 'bonjour';
import debug from 'debug';
import { destructuredPromise } from '../utils/promise';
import { setConfig, getConfigField } from '../coordinator/config';

const l = debug('soundsync:detector');

const detectorEvents = new EventEmitter();
let detector: bonjour.Browser;

export const publishService = (port) => {
  try {
    bonjour().publish({
      name: 'soundsync',
      port,
      type: 'soundsync',
    });
  } catch (e) {
    l('Error while casting the coordinator with Bonjour', e);
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
    l('Error while detecting coordinator on the local network');
  }
};

export const onDetectionChange = (handler: (services: bonjour.Service[]) => any) => {
  detectorEvents.on('update', () => handler(detector.services));
};

export const getDetectedCoordinators = () => detector.services;

interface CoordinatorSelection {
  isCoordinator: boolean;
  coordinatorHost?: string;
}

const [waitForCoordinatorSelectionPromise, selectCoordinator] = destructuredPromise<CoordinatorSelection>();
export const waitForCoordinatorSelection = () => waitForCoordinatorSelectionPromise;

export const getCoordinatorFromConfig = (): CoordinatorSelection => {
  if (getConfigField('isCoordinator')) {
    return { isCoordinator: true };
  }
  if (getConfigField('coordinatorHost')) {
    return { isCoordinator: false, coordinatorHost: getConfigField('coordinatorHost') };
  }
  return undefined;
};

export const actAsCoordinator = () => {
  setConfig((config) => { config.isCoordinator = true; });
  selectCoordinator({ isCoordinator: true });
};

export const actAsClientOfCoordinator = (coordinatorHost) => {
  setConfig((config) => {
    config.isCoordinator = false;
    config.coordinatorHost = coordinatorHost;
  });
  selectCoordinator({ isCoordinator: false, coordinatorHost });
};
