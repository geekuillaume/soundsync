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

  destroy = () => {
    this.stopPolling();
    delete initiators[this.uuid];
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

    let body;
    try {
      const res = await superagent.post(`${this.httpEndpoint}/initiator/${this.uuid}/messages`)
        .send(requestBody);
      body = res.body;
    } catch (e) {
      if (e.status === 409) {
        e.shouldAbort = true;
      }
      throw e;
    }

    body.forEach(this.handleReceiveMessage);
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
    const {
      senderUuid, senderVersion, senderInstanceUuid,
    } = ctx.request.body.message as InitiatorMessage;

    ctx.assert(senderUuid !== getLocalPeer().uuid, 409, 'Connecting to own peer');

    if (!initiators[initiatorUuid]) {
      ctx.assert(!!senderUuid && !!senderInstanceUuid && !!senderVersion, 400, 'senderUuid, senderInstanceUuid and senderVersion should be set');
      ctx.assert(senderVersion === SOUNDSYNC_VERSION, 400, `Different version of Soundsync, please check each client is on the same version.\nOwn version: ${SOUNDSYNC_VERSION}\nOther peer version: ${senderVersion}`);

      const peer = new WebrtcPeer({
        uuid: `placeholderForHttpInitiatorRequest_${initiatorUuid}`,
        name: `placeholderForHttpInitiatorRequest_${initiatorUuid}`,
        instanceUuid: senderInstanceUuid,
        initiatorConstructor: createHttpApiInitiator(
          body.senderHttpEndpointPort ? `http://[${ctx.request.ip}]:${body.senderHttpEndpointPort}` : null,
          initiatorUuid,
        ),
      });
      getPeersManager().registerPeer(peer);
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
