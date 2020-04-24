import { EventEmitter } from 'events';
import debug from 'debug';
import _ from 'lodash';

import { WebAudioSink } from './sinks/webaudio_sink';
import { RtAudioSource } from './sources/rtaudio_source';
import { AudioSource } from './sources/audio_source';
import { LibrespotSource } from './sources/librespot_source';
import { SourceDescriptor, SourceUUID } from './sources/source_type';
import { RemoteSource } from './sources/remote_source';
import { AudioSink } from './sinks/audio_sink';
import { SinkDescriptor, SinkUUID } from './sinks/sink_type';
import { LocalDeviceSink } from './sinks/localdevice_sink';
import { RemoteSink } from './sinks/remote_sink';
import { getConfigField, updateConfigArrayItem, deleteConfigArrayItem } from '../coordinator/config';
import { getAudioDevices } from '../utils/soundio';
import { NullSource } from './sources/null_source';
import { NullSink } from './sinks/null_sink';
import { getLocalPeer } from '../communication/local_peer';

const log = debug(`soundsync:sourcesSinksManager`);

export class AudioSourcesSinksManager extends EventEmitter {
  autodetect: boolean;
  sources: AudioSource[] = [];
  sinks: AudioSink[] = [];

  constructor() {
    super();
    const updateConfigForSource = (source: AudioSource) => {
      if (source.local) {
        updateConfigArrayItem('sources', source.toDescriptor());
      }
    };
    const updateConfigForSink = (sink: AudioSink) => {
      if (sink.local) {
        updateConfigArrayItem('sinks', sink.toDescriptor());
      }
    };
    this.on('sourceUpdate', updateConfigForSource);
    this.on('newLocalSource', updateConfigForSource);

    this.on('sinkUpdate', updateConfigForSink);
    this.on('newLocalSink', updateConfigForSink);
  }

  autodetectDevices = () => {
    log(`Detecting local audio devices`);
    getAudioDevices().outputDevices.forEach((device) => {
      this.addSink({
        type: 'localdevice',
        deviceId: device.id,
        name: device.name,
        peerUuid: getLocalPeer().uuid,
        volume: 1,
        pipedFrom: null,
        available: true,
      });
      // if (audioApiSupportsLoopback()) {
      //   this.addSource({
      //     type: 'rtaudio',
      //     deviceName: device.name,
      //     name: `Output of ${device.name}`,
      //     peerUuid: getLocalPeer().uuid,
      //   });
      // }
    });
  }

  getSourceByUuid = (uuid: SourceUUID) => _.find(this.sources, { uuid });
  getSinkByUuid = (uuid: SinkUUID) => _.find(this.sinks, { uuid });

  addSource(sourceDescriptor: SourceDescriptor) {
    if (sourceDescriptor.uuid && this.getSourceByUuid(sourceDescriptor.uuid)) {
      this.getSourceByUuid(sourceDescriptor.uuid).updateInfo(sourceDescriptor);
      return;
    }
    if (sourceDescriptor.type === 'rtaudio' && sourceDescriptor.peerUuid === getLocalPeer().uuid) {
      // when auto detecting rtaudio devices on local host, we cannot compare with the uuid
      // so we need to compare with the device name to see if we need to update the existing
      // or add a new Source
      const existingSource = _.find(this.sources, (source) => source instanceof RtAudioSource
        && source.deviceName === sourceDescriptor.deviceName
        && source.peerUuid === sourceDescriptor.peerUuid);
      if (existingSource) {
        existingSource.updateInfo(sourceDescriptor);
        return;
      }
    }

    const isLocal = !sourceDescriptor.peerUuid || sourceDescriptor.peerUuid === getLocalPeer().uuid;
    log(`Adding source ${sourceDescriptor.name} of type ${sourceDescriptor.type}`);
    let source;
    if (!isLocal) {
      source = new RemoteSource(sourceDescriptor, this);
    } else if (sourceDescriptor.type === 'librespot') {
      source = new LibrespotSource(sourceDescriptor, this);
    } else if (sourceDescriptor.type === 'null') {
      source = new NullSource(sourceDescriptor, this);
    } else if (sourceDescriptor.type === 'rtaudio') {
      source = new RtAudioSource(sourceDescriptor, this);
    } else {
      // @ts-ignore
      throw new Error(`Unknown source type ${sourceDescriptor.type}`);
    }

    this.sources.push(source);
    if (source.local) {
      this.emit('newLocalSource', source);
      this.emit('localSoundStateUpdated');
    }
    this.emit('soundstateUpdated');
  }

  removeSource(uuid: string) {
    const source = this.getSourceByUuid(uuid);
    if (!source) {
      log(`Tried to remove unknown source ${uuid}, ignoring`);
      return;
    }
    source.stop();
    log(`Removing source ${source.name} (type: ${source.type} uuid: ${uuid})`);
    this.sources = _.filter(this.sources, (s) => s.uuid !== uuid);
    this.emit('soundstateUpdated');
    if (source.local) {
      this.emit('localSoundStateUpdated');
      deleteConfigArrayItem('sources', source.toDescriptor());
    }
  }

  addSink(sinkDescriptor: SinkDescriptor) {
    if (sinkDescriptor.uuid && this.getSinkByUuid(sinkDescriptor.uuid)) {
      this.getSinkByUuid(sinkDescriptor.uuid).updateInfo(sinkDescriptor);
      return;
    }
    if (sinkDescriptor.type === 'localdevice' && sinkDescriptor.peerUuid === getLocalPeer().uuid) {
      // when auto detecting localdevice devices on local host, we cannot compare with the uuid
      // so we need to compare with the device name to see if we need to update the existing
      // or add a new Sink
      const existingSink = _.find(this.sinks, (sink) => sink instanceof LocalDeviceSink
        && sink.deviceId === sinkDescriptor.deviceId
        && sink.peerUuid === sinkDescriptor.peerUuid);
      if (existingSink) {
        return;
      }
    }
    if (sinkDescriptor.type === 'webaudio' && sinkDescriptor.peerUuid === getLocalPeer().uuid) {
      // Only one webaudio sink per browser can be created, if trying to create a new local one, update the existing
      const existingSink = _.find(this.sinks, (sink) => sink instanceof WebAudioSink
        && sink.peerUuid === sinkDescriptor.peerUuid);
      if (existingSink) {
        existingSink.updateInfo(sinkDescriptor);
        return;
      }
    }

    log(`Adding sink  ${sinkDescriptor.name} of type ${sinkDescriptor.type}`);
    let sink: AudioSink;
    const isLocal = !sinkDescriptor.peerUuid || sinkDescriptor.peerUuid === getLocalPeer().uuid;
    if (!isLocal) {
      sink = new RemoteSink(sinkDescriptor, this);
    } else if (sinkDescriptor.type === 'localdevice') {
      sink = new LocalDeviceSink(sinkDescriptor, this);
    } else if (sinkDescriptor.type === 'null') {
      sink = new NullSink(sinkDescriptor, this);
    } else if (sinkDescriptor.type === 'webaudio') {
      sink = new WebAudioSink(sinkDescriptor, this);
    } else {
      // @ts-ignore
      throw new Error(`Unknown sink type ${sinkDescriptor.type}`);
    }

    this.sinks.push(sink);
    if (sink.local) {
      this.emit('newLocalSink', sink);
      this.emit('localSoundStateUpdated');
    }
    this.emit('soundstateUpdated');
  }

  removeSink(uuid: string) {
    const sink = this.getSinkByUuid(uuid);
    if (!sink) {
      log(`Tried to remove unknown sink ${uuid}, ignoring`);
      return;
    }
    // TODO: stop sink
    log(`Removing sink ${sink.name} (type: ${sink.type} uuid: ${uuid})`);
    this.sinks = _.filter(this.sinks, (s) => s.uuid !== uuid);
    this.emit('soundstateUpdated');
    if (sink.local) {
      this.emit('localSoundStateUpdated');
    }
  }

  addFromConfig() {
    const sources = getConfigField('sources');
    sources.forEach((source) => {
      this.addSource({
        ...source,
        peerUuid: getLocalPeer().uuid,
      });
    });
    const sinks = getConfigField('sinks');
    sinks.forEach((sink) => {
      this.addSink({
        ...sink,
        peerUuid: getLocalPeer().uuid,
      });
    });
  }
}

const audioSourcesSinksManager = new AudioSourcesSinksManager();
export const getAudioSourcesSinksManager = () => audioSourcesSinksManager;
