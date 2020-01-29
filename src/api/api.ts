import { Context } from 'koa';
import _ from 'lodash';
import debug from 'debug';
import {resolve} from 'path';
import Router from 'koa-router';
import koaStatic from 'koa-static';

import { SoundSyncHttpServer } from '../communication/http_server';
import { HostCoordinator } from '../coordinator/host_coordinator';
import { getAudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { getWebrtcServer } from '../communication/wrtc_server';

const log = debug(`soundsync:api`);

export class ApiController {
  httpServer: SoundSyncHttpServer;
  coordinator: HostCoordinator;

  constructor(
    httpServer: SoundSyncHttpServer,
    coordinator: HostCoordinator,
  ) {
    this.httpServer = httpServer;
    this.coordinator = coordinator;

    this.httpServer.router.get('/state', this.handleStateRoute);
    this.httpServer.router.post('/source/:sourceUuid/pipe_to_sink/:sinkUuid', this.handleCreatePipe);
    this.httpServer.router.delete('/source/:sourceUuid/pipe_to_sink/:sinkUuid', this.handleDeletePipe);
    this.httpServer.router.put('/source/:sourceUuid', this.handleSourceUpdate);
    this.httpServer.router.put('/sink/:sinkUuid', this.handleSinkUpdate);
    this.httpServer.app.use(koaStatic(resolve(__dirname, '../../webui/dist')))
    log(`Regitered API`);
  }

  handleStateRoute = async (ctx: Context) => {
    ctx.body = {
      sources: getAudioSourcesSinksManager().sources.map((source) => source.toObject()),
      sinks: getAudioSourcesSinksManager().sinks.map((sink) => sink.toObject()),
      peers: _.map(getWebrtcServer().peers, (peer) => ({
        name: peer.name,
        uuid: peer.uuid,
        coordinator: peer.coordinator,
      })),
      pipes: this.coordinator.pipes,
    }
  }

  handleCreatePipe = async (ctx: Context) => {
    const {sourceUuid, sinkUuid} = ctx.params;
    const source = _.find(getAudioSourcesSinksManager().sources, {uuid: sourceUuid});
    const sink = _.find(getAudioSourcesSinksManager().sinks, {uuid: sinkUuid});

    if (!source || !sink) {
      ctx.body = {
        status: 'error',
        error: 'Source or sink unknown',
      };
      ctx.status = 400;
      return;
    }

    this.coordinator.createPipe(source, sink);
    ctx.body = {
      status: 'ok',
    }
  }

  handleDeletePipe = async (ctx: Context) => {
    const {sourceUuid, sinkUuid} = ctx.params;
    const source = _.find(getAudioSourcesSinksManager().sources, {uuid: sourceUuid});
    const sink = _.find(getAudioSourcesSinksManager().sinks, {uuid: sinkUuid});

    if (!source || !sink) {
      ctx.body = {
        status: 'error',
        error: 'Source or sink unknown',
      };
      ctx.status = 400;
      return;
    }

    this.coordinator.destroyPipe(source, sink);
    ctx.body = {
      status: 'ok',
    }
  }

  handleSourceUpdate = async (ctx: Context) => {
    const source = _.find(getAudioSourcesSinksManager().sources, {uuid: ctx.params.sourceUuid});
    ctx.assert(source, 404, { status: 'error', error: 'Source unknown' });
    ctx.assert(typeof ctx.request.body === 'object', 400, {status: 'error', error: 'Body should be an object'});

    source.patch(ctx.request.body);
    ctx.body = {
      status: 'ok',
      source: source.toObject(),
    };
  }

  handleSinkUpdate = async (ctx: Context) => {
    const sink = _.find(getAudioSourcesSinksManager().sinks, {uuid: ctx.params.sinkUuid});
    ctx.assert(sink, 404, { status: 'error', error: 'Sink unknown' });
    ctx.assert(typeof ctx.request.body === 'object', 400, {status: 'error', error: 'Body should be an object'});

    sink.patch(ctx.request.body);
    ctx.body = {
      status: 'ok',
      sink: sink.toObject(),
    };
  }
}
