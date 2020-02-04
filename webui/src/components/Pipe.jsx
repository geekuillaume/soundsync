import React from 'react';
import {find} from 'lodash-es';
import { useSinks, useSources } from '../utils/useSoundSyncState';

export const Pipe = ({pipe}) => {
  const sources = useSources();
  const sinks = useSinks();
  const sink = find(sinks, {uuid: pipe.sinkUuid});
  const source = find(sources, {uuid: pipe.sourceUuid});
  if (!sink || !source) {
    return false;
  }
  const sinkIndex = sinks.indexOf(sink);
  const sourceIndex = sources.indexOf(source);

  const rowStart = Math.min(sourceIndex, sinkIndex);
  const rowEnd = Math.max(sourceIndex, sinkIndex);

  return (
    <div
      className="pipe"
      style={{
        gridRowStart: rowStart + 2,
        gridRowEnd: rowEnd + 3,
      }}
    >
      <svg>
        <line
          x1="10"
          x2="calc(100% - 10px)"
          y1={sourceIndex <= sinkIndex ? '50px' : 'calc(100% - 50px)'}
          y2={sourceIndex <= sinkIndex ? 'calc(100% - 50px)' : '50px'}
        />
      </svg>
    </div>
  );
}

