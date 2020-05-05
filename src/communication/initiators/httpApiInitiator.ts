import superagent from 'superagent';

import Router from 'koa-router';
import { getLocalPeer } from '../local_peer';
import { SOUNDSYNC_VERSION } from '../../utils/constants';
import { getPeersManager } from '../get_peers_manager';
import { WebrtcPeer } from '../wrtc_peer';
import { WebrtcInitiator, InitiatorMessage, InitiatorMessageContent } from './initiator';
import { Capacity } from '../peer';
import { getConfigField } from '../../coordinator/config';

const POLLING_INTERVAL = 2000;

const initiators: {[initiatorUuid: string]: HttpApiInitiator} = {};

interface HttpApiPostMessage {
  senderHttpEndpointPort?: number;
  message: InitiatorMessage;
}

export class HttpApiInitiator extends WebrtcInitiator {
  type = 'http api';
  public messagesToEmitBuffer: InitiatorMessage[] = [];
  private pollingInterval;

  constructor(
    uuid: string,
    handleReceiveMessage: (message: InitiatorMessage) => void,
    public httpEndpoint: string,
  ) {
    super(uuid, handleReceiveMessage);
    initiators[this.uuid] = this;
  }

  sendMessage = async (message: InitiatorMessageContent) => {
    const requestBody: HttpApiPostMessage = {
      senderHttpEndpointPort: getLocalPeer().capacities.includes(Capacity.HttpServerAccessible) ? getConfigField('port') : null,
      message: {
        senderUuid: getLocalPeer().uuid,
        senderInstanceUuid: getLocalPeer().instanceUuid,
        senderVersion: SOUNDSYNC_VERSION,
        ...message,
      },
    };

    if (!this.httpEndpoint) {
      this.messagesToEmitBuffer.push(requestBody.message);
      return;
    }
    const { body } = await superagent.post(`${this.httpEndpoint}/initiator/${this.uuid}/messages`)
      .send(requestBody);
    body.forEach(this.handleReceiveMessage);
    // TODO: handle fatal error 409 that should delete peer and not retry
  }

  startPolling = () => {
    if (getLocalPeer().capacities.includes(Capacity.HttpServerAccessible)) {
      // nothing to do as updates will be received by the http server directly
      return;
    }
    if (this.pollingInterval) {
      return;
    }
    this.pollingInterval = setInterval(this.poll, POLLING_INTERVAL);
  }

  stopPolling = () => {
    if (!this.pollingInterval) {
      return;
    }
    clearInterval(this.pollingInterval);
    delete this.pollingInterval;
  }

  poll = async () => {
    const { body } = await superagent.get(`${this.httpEndpoint}/initiator/${this.uuid}/messages`);
    body.forEach(this.handleReceiveMessage);
  }
}

export const createHttpApiInitiator = (httpEndpoint: string, uuid?: string) => (
  handleReceiveMessage: (message: InitiatorMessage) => void,
) => (
  new HttpApiInitiator(uuid, handleReceiveMessage, httpEndpoint)
);

export const initHttpServerRoutes = (router: Router) => {
  router.post('/initiator/:uuid/messages', async (ctx) => {
    const body = ctx.request.body as HttpApiPostMessage;
    const initiatorUuid = ctx.params.uuid;
    ctx.assert(initiatorUuid, 400, 'Initiator uuid required');

    if (!initiators[initiatorUuid]) {
      const {
        senderUuid, senderVersion, senderInstanceUuid,
      } = ctx.request.body.message as InitiatorMessage;
      ctx.assert(!!senderUuid && !!senderInstanceUuid && !!senderVersion, 400, 'senderUuid, senderInstanceUuid and senderVersion should be set');
      if (senderVersion !== SOUNDSYNC_VERSION) {
        ctx.throw(`Different version of Soundsync, please check each client is on the same version.\nOwn version: ${SOUNDSYNC_VERSION}\nOther peer version: ${senderVersion}`, 400);
      }

      const existingPeer = getPeersManager().peers[senderUuid];
      if (existingPeer) {
        if (existingPeer.instanceUuid === senderInstanceUuid) {
          ctx.throw(409, 'peer with same uuid and instanceUuid already exist');
        }
        // existingPeer.delete(true, 'new peer with same uuid but different instanceUuid connecting');
        // TODO: add reason to delete method
        existingPeer.delete();
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const peer = new WebrtcPeer({
        uuid: senderUuid,
        name: `placeholderForHttpApiJoin_${ctx.request.ip}`,
        host: ctx.request.ip,
        instanceUuid: senderInstanceUuid,
        initiatorConstructor: createHttpApiInitiator(
          body.senderHttpEndpointPort ? `http://[${ctx.request.ip}]:${body.senderHttpEndpointPort}` : null,
          initiatorUuid,
        ),
      });
    }
    await initiators[initiatorUuid].handleReceiveMessage(body.message);
    ctx.body = initiators[initiatorUuid].messagesToEmitBuffer;
    initiators[initiatorUuid].messagesToEmitBuffer = [];
    ctx.status = 200;
  });

  router.get('/initiator/:uuid/messages', async (ctx) => {
    const initiatorUuid = ctx.params.uuid;
    ctx.assert(initiatorUuid, 400, 'Initiator uuid required');

    const initiator = initiators[initiatorUuid];
    if (initiator) {
      ctx.body = initiators[initiatorUuid].messagesToEmitBuffer;
      initiators[initiatorUuid].messagesToEmitBuffer = [];
    } else {
      ctx.body = [];
    }
  });
};
