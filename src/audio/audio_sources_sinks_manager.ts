import { EventEmitter } from 'events';
import debug from 'debug';
import _ from 'lodash';

import { AudioSource } from './sources/audio_source';
import { LibrespotSource } from './sources/librespot_source';
import { SourceDescriptor } from './sources/source_type';
import { RemoteSource } from './sources/remote_source';
import { AudioSink } from './sinks/audio_sink';
import { SinkDescriptor } from './sinks/sink_type';
import { RtAudioSink } from './sinks/rtaudio_sink';
import { RemoteSink } from './sinks/remote_sink';
import { getConfigField, updateConfigArrayItem } from '../coordinator/config';
import { getAudioDevices } from '../utils/rtaudio';

const log = debug(`soundsync:sourcesManager`);

export class AudioSourcesSinksManager extends EventEmitter {
  autodetect: boolean;
  sources: AudioSource[] = [];
  sinks: AudioSink[] = [];

  constructor() {
    super();
    const updateConfigForSource = (source: AudioSource) => {
      if (source instanceof LibrespotSource) {
        updateConfigArrayItem('sources', source.toDescriptor());
      }
    };
    this.on('sourceUpdate', updateConfigForSource);
    this.on('newLocalSource', updateConfigForSource);
    this.on('newLocalSink', (sink: AudioSink) => {
      if (sink instanceof RtAudioSink) {
        updateConfigArrayItem('sinks', sink.toDescriptor());
      }
    })
  }

  autodetectDevices = () => {
    log(`Detecting local audio devices`);
    getAudioDevices().forEach((device) => {
      if (device.outputChannels > 0) { // filter microphones, useful for windows / osx
        this.addSink({
          type: 'rtaudio',
          deviceName: device.name,
          name: device.name,
        });
      }
    });
  }

  addSource(sourceDescriptor: SourceDescriptor) {
    if (sourceDescriptor.uuid) {
      const existingSource = _.find(this.sources, {uuid: sourceDescriptor.uuid});
      if (existingSource) {
        log(`Trying to add source which already exists, updating existing`);
        existingSource.updateInfo(sourceDescriptor);
        return;
      }
    }

    log(`Adding source ${sourceDescriptor.name} of type ${sourceDescriptor.type}`);
    if (sourceDescriptor.type === 'librespot') {
      const source = new LibrespotSource(sourceDescriptor, this);
      this.sources.push(source);
      this.emit('newLocalSource', source);
    }
    if (sourceDescriptor.type === 'remote') {
      const source = new RemoteSource(sourceDescriptor, this);
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
    if (_.find(this.sinks, {uuid: sinkDescriptor.uuid}) || (
      sinkDescriptor.type === 'rtaudio' && _.find(this.sinks, (sink) =>
        sink.type === 'rtaudio' &&
        // @ts-ignore
        sink.deviceName === sinkDescriptor.deviceName
      )
    )) {
      log(`Trying to add sink which already exists, ignoring`);
      return;
    }

    log(`Adding sink  ${sinkDescriptor.name} of type ${sinkDescriptor.type}`);
    if (sinkDescriptor.type === 'rtaudio') {
      const sink = new RtAudioSink(sinkDescriptor);
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

  addFromConfig() {
    const sources = getConfigField('sources');
    sources.forEach((source) => {
      this.addSource(source);
    });
    const sinks = getConfigField('sinks');
    sinks.forEach((sink) => {
      this.addSink(sink);
    });
  }
}
