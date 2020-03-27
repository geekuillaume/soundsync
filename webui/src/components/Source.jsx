import React from 'react';
import classnames from 'classnames';
import { Zoom } from '@material-ui/core';
import {
  usePeer, useSources, useRegisterForPipe, useShowHidden,
} from '../utils/useSoundSyncState';
import { useEditAudioStreamModal } from './editModal';

import SpotifyLogo from '../res/spotify.svg';
import nullSinkLogo from '../res/null.svg';
import computerIcon from '../res/computer.svg';
import { nameWithoutHiddenMeta, isHidden } from '../utils/hiddenUtils';
import { HiddenIndicator } from './utils/HiddenIndicator';

const logos = {
  librespot: SpotifyLogo,
  null: nullSinkLogo,
  localdevice: computerIcon,
};

export const Source = ({ source }) => {
  const [shouldShow, isSelectedElement, registerForPipe] = useRegisterForPipe('source', source);
  const peer = usePeer(source.peerUuid);
  const sourceLogo = logos[source.type];
  const sources = useSources();
  const sourceIndex = sources.indexOf(source);
  const { handleOpen, anchor, modal } = useEditAudioStreamModal('source', source);
  const hidden = isHidden(source.name);
  const shouldShowHidden = useShowHidden();

  return (
    <Zoom
      in={!hidden || shouldShowHidden}
      mountOnEnter
      unmountOnExit
      appear
      style={{
        transformOrigin: '0 50%',
      }}
    >
      <div
        className={classnames('source-container', !shouldShow && 'not-selectable')}
        style={{ gridRow: sourceIndex + 2 }}
        ref={anchor}
      >
        <div
          className="handle"
          onClick={registerForPipe}
        />
        <div className="box source-box" onClick={handleOpen}>
          <img src={sourceLogo} className="source-logo" />
          <p className="name">{nameWithoutHiddenMeta(source.name)}</p>
          <p className="peer-name">{peer.name}</p>
          {hidden && <HiddenIndicator />}
        </div>
        {modal}
      </div>
    </Zoom>
  );
};
