import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

import {
  useSinks, useSources, usePipes, useIsConnected,
} from '../utils/useSoundSyncState';
import { Source } from './Source';
import { Sink } from './Sink';
import { Pipe } from './Pipe';
import { AddSinkButton } from './AddSinkButton';
import { AddSourceButton } from './AddSource';

export const SoundState = () => {
  const pipes = usePipes();
  const sinks = useSinks();
  const sources = useSources();
  const isConnected = useIsConnected();

  return (
    <div className="container">
      <div className="scene-grid">
        <p className="sources-title">Sources</p>
        <div className="sinks-title">
          Speakers
        </div>
        {isConnected
          ? (
            <>
              <SourcesList sources={sources} />
              <PipesList pipes={pipes} />
              <SinksList sinks={sinks} />
              <AddSourceButton />
              <AddSinkButton />
            </>
          ) : (
            <div className="connecting-message">
              <CircularProgress />
              <p>Connecting...</p>
            </div>
          )}
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
