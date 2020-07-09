import React, { useState, useEffect } from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';

import {
  useSinks, useSources, usePipes, useIsConnected,
} from '../utils/useSoundSyncState';
import { Source } from './Source';
import { Sink } from './Sink';
import { Pipe } from './Pipe';
import { AddSinkButton } from './AddSink/AddSinkButton';
import { AddSourceButton } from './AddSource';
import { FirstUse } from './FirstUse/FirstUse';

export const SoundState = () => {
  const pipes = usePipes();
  const sinks = useSinks();
  const sources = useSources();
  const isConnected = useIsConnected();

  return (
    <div className="container">
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
    }
  }, []);

  return (
    <>
      <div className="connecting-message">
        <CircularProgress />
        <p>Connecting...</p>
        {longConnect && <p>
          Soundsync is scanning your local network for Soundsync enabled devices. Make sure Soundsync is started on your computer and that you are connected to the same network / wifi as the other devices. If this doesn't work, try using the "Open Controller" button in the Soundsync menu on your computer system tray.
        </p>}
      </div>
      <FirstUse />
    </>
  );
}
