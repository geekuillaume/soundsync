// import { Context } from 'koa';
// import _ from 'lodash';
import path from 'path';
import koaStatic from 'koa-static';
import send from 'koa-send';

import { l } from '../utils/environment/log';
import { SoundSyncHttpServer } from '../communication/http_server';
// import { getAudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
// import { getClientCoordinator } from '../coordinator/client_coordinator';

const log = l.extend(`api`);

const WEBUI_ROOT_PATH = path.join(__dirname, '../../webui/dist');
export const attachApi = (httpServer: SoundSyncHttpServer) => {
  // this.httpServer.router.get('/state', this.handleStateRoute);
  // this.httpServer.router.post('/source/:sourceUuid/pipe_to_sink/:sinkUuid', this.handleCreatePipe);
  // this.httpServer.router.delete('/source/:sourceUuid/pipe_to_sink/:sinkUuid', this.handleDeletePipe);
  // this.httpServer.router.put('/source/:sourceUuid', this.handleSourceUpdate);
  // this.httpServer.router.put('/sink/:sinkUuid', this.handleSinkUpdate);
  httpServer.app.use(koaStatic(WEBUI_ROOT_PATH, {
    maxage: 365 * 24 * 1000 * 60 * 60, // 365 days cache
  }));
  httpServer.app.use(async (ctx, next) => {
    await next();
    if (ctx.status === 404) {
      // Because the webui handles its own router, we need to return index.html on every 404
      await send(ctx, `index.html`, { root: WEBUI_ROOT_PATH });
    }
  });
  log(`Regitered API`);
};

// export class ApiController {
//   httpServer: SoundSyncHttpServer;

//   constructor(
//     httpServer: SoundSyncHttpServer,
//   ) {
//     this.httpServer = httpServer;

//     this.httpServer.router.get('/state', this.handleStateRoute);
//     this.httpServer.router.post('/source/:sourceUuid/pipe_to_sink/:sinkUuid', this.handleCreatePipe);
//     this.httpServer.router.delete('/source/:sourceUuid/pipe_to_sink/:sinkUuid', this.handleDeletePipe);
//     this.httpServer.router.put('/source/:sourceUuid', this.handleSourceUpdate);
//     this.httpServer.router.put('/sink/:sinkUuid', this.handleSinkUpdate);
//     this.httpServer.app.use(koaStatic(path.join(__dirname, '../../webui/dist')));
//     log(`Regitered API`);
//   }

//   handleStateRoute = async (ctx: Context) => {
//     ctx.body = {
//       sources: getAudioSourcesSinksManager().sources.filter((s) => s.peer && s.peer.state === 'connected').map((source) => source.toObject()),
//       sinks: getAudioSourcesSinksManager().sinks.filter((s) => s.peer && s.peer.state === 'connected').map((sink) => sink.toObject()),
//       peers: _.map(getWebrtcServer().peers, (peer) => ({
//         name: peer.name,
//         uuid: peer.uuid,
//         coordinator: peer.coordinator,
//       })),
//       pipes: getClientCoordinator().pipes,
//     };
//   }

//   handleCreatePipe = async (ctx: Context) => {
//     const { sourceUuid, sinkUuid } = ctx.params;
//     const source = _.find(getAudioSourcesSinksManager().sources, { uuid: sourceUuid });
//     const sink = _.find(getAudioSourcesSinksManager().sinks, { uuid: sinkUuid });

//     if (!source || !sink) {
//       ctx.body = {
//         status: 'error',
//         error: 'Source or sink unknown',
//       };
//       ctx.status = 400;
//       return;
//     }

//     createPipe(source, sink);
//     ctx.body = {
//       status: 'ok',
//     };
//   }

//   handleDeletePipe = async (ctx: Context) => {
//     const { sourceUuid, sinkUuid } = ctx.params;

//     this.coordinator.destroyPipe(sourceUuid, sinkUuid);
//     ctx.body = {
//       status: 'ok',
//     };
//   }

//   handleSourceUpdate = async (ctx: Context) => {
//     const source = _.find(getAudioSourcesSinksManager().sources, { uuid: ctx.params.sourceUuid });
//     ctx.assert(source, 404, { status: 'error', error: 'Source unknown' });
//     ctx.assert(typeof ctx.request.body === 'object', 400, { status: 'error', error: 'Body should be an object' });

//     source.patch(ctx.request.body);
//     ctx.body = {
//       status: 'ok',
//       source: source.toObject(),
//     };
//   }

//   handleSinkUpdate = async (ctx: Context) => {
//     const sink = _.find(getAudioSourcesSinksManager().sinks, { uuid: ctx.params.sinkUuid });
//     ctx.assert(sink, 404, { status: 'error', error: 'Sink unknown' });
//     ctx.assert(typeof ctx.request.body === 'object', 400, { status: 'error', error: 'Body should be an object' });

//     sink.patch(ctx.request.body);
//     ctx.body = {
//       status: 'ok',
//       sink: sink.toObject(),
//     };
//   }
// }
