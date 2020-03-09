import React from 'react';

import {
  useSinks, useSources, usePipes,
} from '../utils/useSoundSyncState';
import { Source } from './Source';
import { Sink } from './Sink';
import { Pipe } from './Pipe';
import { AddSinkButton } from './AddSinkButton';
import { AddSourceButton } from './AddSourceButton';

export const SoundState = () => {
  const pipes = usePipes();
  const sinks = useSinks();
  const sources = useSources();

  return (
    <div className="container">
      <div className="scene-grid">
        <p className="sources-title">Sources</p>
        <div className="sinks-title">
          Speakers
        </div>
        {sinks && (
          <>
            <SourcesList sources={sources} />
            <PipesList pipes={pipes} />
            <SinksList sinks={sinks} />
          </>
        )}
        <AddSourceButton />
        <AddSinkButton />
      </div>
    </div>
  );
};

const SinksList = ({ sinks }) => (
  sinks.map((sink) => (
    <Sink sink={sink} key={sink.uuid} />
  ))
);

const SourcesList = ({ sources }) => (
  sources.map((source) => (
    <Source source={source} key={source.uuid} />
  ))
);

const PipesList = ({ pipes }) => (
  pipes.map((pipe) => (
    <Pipe pipe={pipe} key={`${pipe.sourceUuid}-${pipe.sinkUuid}`} />
  ))
);
