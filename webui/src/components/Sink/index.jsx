import React, { useState, useRef } from 'react';
import classnames from 'classnames';
import { Zoom } from '@material-ui/core';

import speaker from 'res/speaker.svg';
import nullSinkLogo from 'res/null.svg';
import browserIcon from 'res/browser.svg';
import { nameWithoutHiddenMeta, isHidden } from 'utils/hiddenUtils';
import {
  usePeer, useSinks, useRegisterForPipe, useUnpipeAction, useShowHidden,
} from 'utils/useSoundSyncState';
import { HiddenIndicator } from 'components/utils/HiddenIndicator';
import { SinkContextMenu } from './SinkContextMenu';
import { getLocalPeer } from '../../../../src/communication/local_peer';

const logos = {
  localdevice: speaker,
  null: nullSinkLogo,
  webaudio: browserIcon,
};

export const Sink = ({ sink }) => {
  const [shouldShow, isSelectedElement, registerForPipe] = useRegisterForPipe('sink', sink);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const anchor = useRef();
  const handleUnpipe = useUnpipeAction(sink);
  const peer = usePeer(sink.peerUuid);

  const sinks = useSinks();
  const sinkIndex = sinks.indexOf(sink);
  const sinkLogo = logos[sink.type];

  const hidden = isHidden(sink.name);
  const shouldShowHidden = useShowHidden();

  return (
    <Zoom
      in={!hidden || shouldShowHidden}
      mountOnEnter
      unmountOnExit
      appear
      style={{
        transformOrigin: '100% 50%',
      }}
    >
      <div
        className={classnames('sink-container', !shouldShow && 'not-selectable')}
        style={{ gridRow: sinkIndex + 2 }}
        ref={anchor}
      >
        <div
          className="handle"
          onClick={registerForPipe}
        />
        <a
          className={classnames('unpipe-button delete is-large', { active: sink.pipedFrom && isSelectedElement })}
          onClick={handleUnpipe}
        />
        <div className="box sink-box" onClick={() => setContextMenuOpen(true)}>
          <img src={sinkLogo} alt="" className="sink-logo" />
          <p className="name">{nameWithoutHiddenMeta(sink.name)}</p>
          <p className={classnames('peer-name', { ownPeer: peer.uuid === getLocalPeer().uuid })}>{peer.name}</p>
          {hidden && <HiddenIndicator position="left" />}
        </div>
        <SinkContextMenu isOpen={contextMenuOpen} sink={sink} onClose={() => setContextMenuOpen(false)} anchor={anchor.current} />
      </div>
    </Zoom>
  );
};
