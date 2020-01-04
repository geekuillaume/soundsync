import { EventEmitter } from 'events';
import debug from 'debug';
import { WebrtcServer } from '../communication/wrtc_server';
import { AudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';

export abstract class Coordinator extends EventEmitter {
  webrtcServer: WebrtcServer;
  audioSourcesSinksManager: AudioSourcesSinksManager;
  log: debug.Debugger;

  constructor(webrtcServer: WebrtcServer, audioSourceManager: AudioSourcesSinksManager) {
    super();
    this.webrtcServer = webrtcServer;
    this.audioSourcesSinksManager = audioSourceManager;
    this.log = debug(`soundsync:coordinator`);
  }
}
