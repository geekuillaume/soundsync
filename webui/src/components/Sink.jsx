import React from 'react';
import classnames from 'classnames';
import { usePeer, useSinks, useRegisterForPipe, useIsSinkPiped, useUnpipeAction } from '../utils/useSoundSyncState';

import speaker from '../res/speaker.svg';
import nullSinkLogo from '../res/null.svg';

const logos = {
  rtaudio: speaker,
  null: nullSinkLogo,
};

export const Sink = ({sink}) => {
  const [shouldShow, isSelectedElement, registerForPipe] = useRegisterForPipe('sink', sink.uuid);
  const isPiped = useIsSinkPiped(sink.uuid);
  const handleUnpipe = useUnpipeAction(sink.uuid);
  const peer = usePeer(sink.peerUuid);
  const sinks = useSinks();
  const sinkIndex = sinks.indexOf(sink);
  const sinkLogo = logos[sink.type];

  return (
    <div
      className={classnames("sink-container", !shouldShow && 'not-selectable')}
      style={{gridRow: sinkIndex + 2}}
    >
      <div
        className="handle"
        onClick={registerForPipe}
      />
      <a
        className={classnames("unpipe-button delete is-large", {active: isPiped && isSelectedElement})}
        onClick={handleUnpipe}
      ></a>
      <div className="box sink-box">
        <img src={sinkLogo} className="sink-logo" />
        <p className="name">{sink.name}</p>
        <p className="peer-name">{peer.name}</p>
      </div>
    </div>
  );
}

