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
import { RemoteSink } from './remote_sink';

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
    if (_.find(this.sources, {uuid: sourceDescriptor.uuid})) {
      log(`Trying to add source which already exists, ignoring`);
      return;
    }

    log(`Adding source ${sourceDescriptor.name} of type ${sourceDescriptor.type}`);
    if (sourceDescriptor.type === 'librespot') {
      const source = new LibrespotSource(sourceDescriptor);
      this.sources.push(source);
      this.emit('newLocalSource', source);
    }
    if (sourceDescriptor.type === 'remote') {
      const source = new RemoteSource(sourceDescriptor);
      // @ts-ignore
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
    if (_.find(this.sinks, {uuid: sinkDescriptor.uuid})) {
      log(`Trying to add sink which already exists, ignoring`);
      return;
    }

    log(`Adding sink  ${sinkDescriptor.name} of type ${sinkDescriptor.type}`);
    if (sinkDescriptor.type === 'defaultPhysical') {
      const sink = new DefaultPhysicalSink(sinkDescriptor);
      this.sinks.push(sink);
      this.emit('newLocalSink', sink);
    } else if (sinkDescriptor.type === 'remote') {
      const sink = new RemoteSink(sinkDescriptor);
      this.sinks.push(sink);
    }
  }

  removeSink(uuid: string) {
    const sink = _.find(this.sinks, {uuid});
    if (!sink) {
      log(`Tried to remove unknown sink ${uuid}, ignoring`);
      return;
    }
    // TODO: stop sink
    log(`Removing sink ${sink.name} (type: ${sink.type} uuid: ${uuid})`);
    this.sinks = _.filter(this.sinks, (sink) => sink.uuid !== uuid);
  }
}
