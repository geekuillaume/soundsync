import React, { useState, useEffect } from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

import {
  useSinks, useSources, usePipes, useIsConnected, useSetTroubleshootingVisible,
} from 'utils/useSoundSyncState';
import { Button } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { Source } from './Source/Source';
import { Sink } from './Sink';
import { Pipe } from './Pipe';
import { AddSinkButton } from './AddSink/AddSinkButton';
import { AddSourceButton } from './AddSource';
import { BetaPopup } from './BetaPopup/BetaPopup';
import { Troubleshooting } from 'components/Troubleshooting/Troubleshooting';

export const SoundState = () => {
  const pipes = usePipes();
  const sinks = useSinks();
  const sources = useSources();
  const isConnected = useIsConnected();

  useEffect(() => {
    window.localStorage.setItem('soundsync:redirectToController', true);
  }, []);

  return (
    <div className="container">
      <BetaPopup />
      <div className="scene-grid">
        <p className="sources-title">Audio Sources</p>
        <div className="sinks-title">
          Speakers
        </div>
        {isConnected && (
        <>
          <SourcesList sources={sources} />
          <PipesList pipes={pipes} />
          <SinksList sinks={sinks} />
          <AddSourceButton />
          <AddSinkButton />
        </>
        )}
      </div>
      {!isConnected && <ConnectingIndicator />}
      <Troubleshooting />
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

const ConnectingIndicator = () => {
  const [longConnect, setLongConnect] = useState(false);
  useEffect(() => {
    const handle = setTimeout(() => setLongConnect(true), 4000);
    return () => {
      clearTimeout(handle);
    };
  }, []);
  const setVisible = useSetTroubleshootingVisible();

  return (
    <>
      <div className="connecting-message">
        <CircularProgress />
        <p>Connecting...</p>
        {longConnect && (
          <>
            <Button variant="outlined" onClick={() => setVisible(true)}>Troubleshooting</Button>
          </>
        )}
      </div>
    </>
  );
};
