import superagent from 'superagent';

import Router from 'koa-router';
import { BUILD_VERSION } from '../../utils/version';
import { getLocalPeer } from '../local_peer';
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
    handleReceiveMessage: (message: InitiatorMessage) => Promise<void>,
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
        senderVersion: BUILD_VERSION,
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
      if (e.status === 409 || e.status === 500) {
        e.shouldAbort = true;
      }
      if (e.status && e.response?.text) {
        throw new Error(`http initiator error: ${e.status}: ${e.response.text}`);
      }
      throw e;
    }
    for (const receivedMessage of body) {
      await this.handleReceiveMessage(receivedMessage);
    }
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
    try {
      const { body } = await superagent.get(`${this.httpEndpoint}/initiator/${this.uuid}/messages`);
      body.forEach(this.handleReceiveMessage);
    } catch {
      // nothing to do, just ignoring the error
    }
  }
}

export const createHttpApiInitiator = (httpEndpoint: string, uuid?: string) => (
  handleReceiveMessage: (message: InitiatorMessage) => Promise<void>,
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
    // this can happens as the handleInitiatorMessage method can throw an error that will destroy the peer instance
    ctx.assert(initiators[initiatorUuid], 500, 'Error while handling initiator message');

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
