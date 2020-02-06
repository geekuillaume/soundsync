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

  constructor(sourceUuid: string, sinkUuid: string) {
    this.sourceUuid = sourceUuid;
    this.sinkUuid = sinkUuid;
  }

  activate = () => {
    if (!this.activable || this.active) {
      return;
    }
    this.sink.linkSource(this.source);
  }

  close = () => {
    if (!this.active) {
      return;
    }
    if (this.sink) {
      this.sink.unlinkSource();
    }
  }

  get source(): AudioSource {
    return _.find(getAudioSourcesSinksManager().sources, { uuid: this.sourceUuid });
  }

  get sink(): AudioSink {
    return _.find(getAudioSourcesSinksManager().sinks, { uuid: this.sinkUuid });
  }

  get active() {
    return this.source && this.sink && this.sink.pipedSource;
  }

  get activable() {
    return !!this.source && !!this.sink;
  }

  toDescriptor(): PipeDescriptor {
    return {
      sourceUuid: this.sourceUuid,
      sinkUuid: this.sinkUuid,
    };
  }
}
