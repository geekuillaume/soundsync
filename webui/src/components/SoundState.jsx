import React, { useEffect } from 'react';
import { useSoundSyncState, usePeer } from '../utils/useSoundSyncState';
import { Source } from './Source';
import { Sink } from './Sink';
import { Pipe } from './Pipe';

export const SoundState = () => {
  const data = useSoundSyncState();
  return (
    <div className="container">
      <div className="scene-grid">
        <p className="sources-title">Sources</p>
        <p className="sinks-title">Speakers</p>
        {data && data.sinks && <>
          <SourcesList sources={data.sources} />
          <PipesList pipes={data.pipes} />
          <SinksList sinks={data.sinks} />
        </>}
      </div>
    </div>
  );
}

const SinksList = ({sinks}) => {
  return (
    sinks.map((sink) => (
      <Sink sink={sink} key={sink.uuid} />
    ))
  );
}

const SourcesList = ({sources}) => {
  return (
    sources.map((source) => (
      <Source source={source} key={source.uuid} />
    ))
  );
}

const PipesList = ({pipes}) => {
  return (
    pipes.map((pipe) => (
      <Pipe pipe={pipe} key={`${pipe.sourceUuid}-${pipe.sinkUuid}`} />
    ))
  );
}
