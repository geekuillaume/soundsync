import { EventEmitter } from 'events';
import debug from 'debug';
import _ from 'lodash';

import { AudioSource } from './audio_source';
import { LibrespotSource } from './librespot_source';
import { SourceDescriptor } from './source_type';
import { RemoteSource } from './remote_source';
import { AudioSink } from './audio_sink';
import { SinkDescriptor } from './sink_type';
import { DefaultPhysicalSink } from './default_physical_sink';

const log = debug(`soundsync:sourcesManager`);

export class AudioSourcesSinksManager extends EventEmitter {
  autodetect: boolean;
  sources: AudioSource[] = [];
  sinks: AudioSink[] = [];

  constructor({ autodetect}) {
    super();
    this.autodetect = autodetect;
  }

  addSource(sourceDescriptor: SourceDescriptor) {
    log(`Adding source ${sourceDescriptor.name} of type ${sourceDescriptor.type}`);
    if (sourceDescriptor.type === 'librespot') {
      const source = new LibrespotSource(sourceDescriptor);
      this.sources.push(source);
      this.emit('newLocalSource', source);
    }
    if (sourceDescriptor.type === 'remote') {
      if (_.find(this.sources, {uuid: sourceDescriptor.uuid})) {
        log(`Trying to add source which already exists, ignoring`);
        return;
      }
      const source = new RemoteSource(sourceDescriptor);
      this.sources.push(source);
    }
  }

  removeSource(uuid: string) {
    const source = _.find(this.sources, {uuid});
    if (!source) {
      log(`Tried to remove unknown source ${uuid}, ignoring`);
      return;
    }
    // TODO: stop source
    log(`Removing source ${source.name} (type: ${source.type} uuid: ${uuid})`);
    this.sources = _.filter(this.sources, (source) => source.uuid !== uuid);
  }

  addSink(sinkDescriptor: SinkDescriptor) {
    log(`Adding sink  ${sinkDescriptor.name} of type ${sinkDescriptor.type}`);
    if (sinkDescriptor.type === 'defaultPhysicalSink') {
      const sink = new DefaultPhysicalSink(sinkDescriptor);
      this.sinks.push(sink);
      this.emit('newLocalSink', sink);
    }
  }
}
