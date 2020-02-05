import React, { useState } from 'react';
import { IconButton, withStyles } from '@material-ui/core';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import { useSinks, useSources, usePipes } from '../utils/useSoundSyncState';
import { Source } from './Source';
import { Sink } from './Sink';
import { Pipe } from './Pipe';

const HiddenButton = withStyles(() => ({
  root: {
    float: 'right',
    marginTop: -12,
  },
}))(IconButton);

export const SoundState = () => {
  const [showHidden, setShowHidden] = useState(false);
  const pipes = usePipes();
  const sinks = useSinks({ withHidden: showHidden });
  const sources = useSources({ withHidden: showHidden });


  return (
    <div className="container">
      <div className="scene-grid">
        <p className="sources-title">Sources</p>
        <div className="sinks-title">
          Speakers
          <HiddenButton aria-label="Show hidden" onClick={() => setShowHidden(!showHidden)}>
            {showHidden ? <VisibilityIcon /> : <VisibilityOffIcon />}
          </HiddenButton>
        </div>
        {sinks && (
          <>
            <SourcesList sources={sources} />
            <PipesList pipes={pipes} />
            <SinksList sinks={sinks} />
          </>
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
