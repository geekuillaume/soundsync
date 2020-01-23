import { Context } from 'koa';
import _ from 'lodash';
import debug from 'debug';
import {resolve} from 'path';
import Router from 'koa-router';
import koaStatic from 'koa-static';
import cors from '@koa/cors';

import { SoundSyncHttpServer } from '../communication/http_server';
import { HostCoordinator } from '../coordinator/host_coordinator';
import { AudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { WebrtcServer } from '../communication/wrtc_server';

const log = debug(`soundsync:api`);

export class ApiController {
  httpServer: SoundSyncHttpServer;
  coordinator: HostCoordinator;
  audioSourcesSinksManager: AudioSourcesSinksManager;
  webrtcServer: WebrtcServer;

  constructor(
    httpServer: SoundSyncHttpServer,
    coordinator: HostCoordinator,
    audioSourcesSinksManager: AudioSourcesSinksManager,
    webrtcServer: WebrtcServer,
  ) {
    this.httpServer = httpServer;
    this.coordinator = coordinator;
    this.audioSourcesSinksManager = audioSourcesSinksManager;
    this.webrtcServer = webrtcServer;

    const router = new Router();
    this.httpServer.app.use(cors({
      // TODO limit CORS access here
    }));
    router.get('/state', this.handleStateRoute);
    router.post('/source/:sourceUuid/pipe_to_sink/:sinkUuid', this.handleCreatePipe);
    router.delete('/source/:sourceUuid/pipe_to_sink/:sinkUuid', this.handleDeletePipe);
    this.httpServer.app.use(router.routes());
    this.httpServer.app.use(router.allowedMethods());
    this.httpServer.app.use(koaStatic(resolve(__dirname, '../../webui/dist')))
    log(`Regitered API`);
  }

  handleStateRoute = async (ctx: Context) => {
    ctx.body = {
      sources: this.audioSourcesSinksManager.sources.map((source) => source.toObject()),
      sinks: this.audioSourcesSinksManager.sinks.map((sink) => sink.toObject()),
      peers: _.map(this.webrtcServer.peers, (peer) => ({
        name: peer.name,
        uuid: peer.uuid,
        coordinator: peer.coordinator,
      })),
      pipes: this.coordinator.pipes.filter((pipe) => pipe.active).map((pipe) => ({
        sourceUuid: pipe.source.uuid,
        sinkUuid: pipe.sink.uuid,
        latency: pipe.latency,
      })),
    }
  }

  handleCreatePipe = async (ctx: Context) => {
    const {sourceUuid, sinkUuid} = ctx.params;
    const source = _.find(this.audioSourcesSinksManager.sources, {uuid: sourceUuid});
    const sink = _.find(this.audioSourcesSinksManager.sinks, {uuid: sinkUuid});

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
    const source = _.find(this.audioSourcesSinksManager.sources, {uuid: sourceUuid});
    const sink = _.find(this.audioSourcesSinksManager.sinks, {uuid: sinkUuid});

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

}
