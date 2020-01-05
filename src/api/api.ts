import { Context } from 'koa';
import _ from 'lodash';
import debug from 'debug';

import { SoundSyncHttpServer } from '../communication/http_server';
import { HostCoordinator } from '../coordinator/host_coordinator';
import { AudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { WebrtcServer } from '../communication/wrtc_server';
import { localPeer } from '../communication/local_peer';

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

    this.httpServer.router.get('/state', this.handleStateRoute);
    this.httpServer.router.post('/source/:sourceUuid/pipe_to_sink/:sinkUuid', this.handleCreatePipe);
    log(`Regitered API`);
  }

  handleStateRoute = async (ctx: Context) => {
    log(`GET /state: Sending current state`);
    ctx.body = {
      sources: this.audioSourcesSinksManager.sources.map((source) => source.toObject()),
      sinks: this.audioSourcesSinksManager.sinks.map((sink) => sink.toObject()),
      peers: _.map(this.webrtcServer.peers, (peer) => ({
        name: peer.name,
        uuid: peer.uuid,
        coordinator: peer.coordinator,
      })),
      pipes: this.coordinator.pipes.map((pipe) => ({
        sourceUuid: pipe.source.uuid,
        sinkUuid: pipe.sink.uuid,
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

    const pipe = this.coordinator.createPipe(source, sink);
    ctx.body = {
      status: 'ok',
    }
  }
}
