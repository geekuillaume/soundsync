import _ from 'lodash';
import { ControllerMessage } from './messages';
import { Peer } from './peer';
import { ownUuid } from '../utils/ownUuid';

class LocalPeer extends Peer {
  constructor({ uuid, name }) {
    super({uuid, name});
    this.state = "connected";
    this.emit('connected');
  }

  sendControllerMessage(message: ControllerMessage) {
    console.log('coucou')
    this.emit('controllerMessage', message);
  }
}

export const localPeer = new LocalPeer({
  name: 'test',
  uuid: ownUuid,
})
