import React, { useState, useRef, useCallback } from 'react';
import { debounce } from 'lodash';
import { useSnackbar } from 'notistack';
import classnames from 'classnames';
import { Zoom } from '@material-ui/core';

import { nameWithoutHiddenMeta, isHidden } from 'utils/hiddenUtils';
import {
  usePeer, useSinks, useRegisterForPipe, useUnpipeAction, useShowHidden,
} from 'utils/useSoundSyncState';
import { HiddenIndicator } from 'components/utils/HiddenIndicator';

import speaker from 'res/speaker.svg';
import nullSinkLogo from 'res/null.svg';
import browserIcon from 'res/browser.svg';
import hueBulbIcon from 'res/huebulb.svg';
import { getLocalPeer } from '../../../../src/communication/local_peer';
import { SinkContextMenu } from './SinkContextMenu';
import { AudioErrorIndicator } from '../utils/AudioErrorIndicator';

const logos = {
  localdevice: speaker,
  null: nullSinkLogo,
  webaudio: browserIcon,
  huelight: hueBulbIcon,
};

export const Sink = ({ sink }) => {
  const { enqueueSnackbar } = useSnackbar();
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

  const peerName = peer.uuid === getLocalPeer().uuid ? 'This browser' : peer.name;

  const handleDrag = useCallback(debounce(() => {
    enqueueSnackbar('Click on the source you want to link');
  }, 5000, { leading: true, trailing: false }), []);

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
          draggable
          onDrag={handleDrag}
        />
        <a
          className={classnames('unpipe-button delete is-large', { active: sink.pipedFrom && isSelectedElement })}
          onClick={handleUnpipe}
        />
        <div className="box sink-box" onClick={() => setContextMenuOpen(true)}>
          <img src={sinkLogo} alt="" className={classnames('sink-logo', sink.type)} />
          <p className="name">
            {nameWithoutHiddenMeta(sink.name)}
          </p>
          <p className={classnames('peer-name', { ownPeer: peer.uuid === getLocalPeer().uuid })}>{peerName}</p>
          {hidden && <HiddenIndicator position="left" />}
          {sink.error && <AudioErrorIndicator error={sink.error} />}
        </div>
        <SinkContextMenu isOpen={contextMenuOpen} sink={sink} onClose={() => setContextMenuOpen(false)} anchor={anchor.current} />
      </div>
    </Zoom>
  );
};
