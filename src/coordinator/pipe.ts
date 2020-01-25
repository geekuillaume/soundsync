import _ from 'lodash';
import { AudioSource } from '../audio/sources/audio_source';
import { getAudioSourcesSinksManager } from '../audio/audio_sources_sinks_manager';
import { AudioSink } from '../audio/sinks/audio_sink';

export interface PipeDescriptor {
  sourceUuid: string;
  sinkUuid: string;
}

export class Pipe {
  sourceUuid: string;
  sinkUuid: string;
  latency: number = 0;
  active: boolean = false;

  constructor(sourceUuid: string, sinkUuid: string) {
    this.sourceUuid = sourceUuid;
    this.sinkUuid = sinkUuid;
  }

  activate = () => {
    if (!this.activable || this.active) {
      return;
    }
    this.sink.linkSource(this.source);
    const closePipe = () => {
      if (this.sink) {
        this.sink.unlinkSource();
      }
      this.active = false;
    }
    this.source.peer.once('disconnected', closePipe);
    this.sink.peer.once('disconnected', closePipe);
    this.active = true;
  }

  get source(): AudioSource {
    return _.find(getAudioSourcesSinksManager().sources, {uuid: this.sourceUuid})
  }

  get sink(): AudioSink {
    return _.find(getAudioSourcesSinksManager().sinks, {uuid: this.sinkUuid});
  }

  get activable() {
    return !!this.source && !!this.sink;
  }

  toDescriptor(): PipeDescriptor {
    return {
      sourceUuid: this.sourceUuid,
      sinkUuid: this.sinkUuid,
    }
  }
}
