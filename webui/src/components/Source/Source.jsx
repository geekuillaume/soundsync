import React, { useCallback, useState, useRef } from 'react';
import { debounce } from 'lodash';
import { useSnackbar } from 'notistack';
import classnames from 'classnames';
import { Zoom } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  usePeer, useSources, useRegisterForPipe, useShowHidden,
} from 'utils/useSoundSyncState';

import SpotifyLogo from 'res/spotify.svg';
import computerIcon from 'res/computer.svg';
import nullSinkLogo from 'res/null.svg';
import airplayIcon from 'res/airplay.svg';
import { nameWithoutHiddenMeta, isHidden } from '../../utils/hiddenUtils';
import { HiddenIndicator } from '../utils/HiddenIndicator';
import { SourceContextMenu } from './SourceContextMenu';


const logos = {
  librespot: SpotifyLogo,
  null: nullSinkLogo,
  localdevice: computerIcon,
  shairport: airplayIcon,
};


const useStyles = makeStyles((t) => ({
  activeIndicator: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    borderRadius: '100%',
    backgroundColor: t.palette.primary.main,
    width: 7,
    height: 7,
  },
}));

export const Source = ({ source }) => {
  const styles = useStyles();
  const [shouldShow, isSelectedElement, registerForPipe] = useRegisterForPipe('source', source);
  const peer = usePeer(source.peerUuid);
  const sourceLogo = logos[source.type];
  const sources = useSources();
  const sourceIndex = sources.indexOf(source);
  const hidden = isHidden(source.name);
  const shouldShowHidden = useShowHidden();
  const { enqueueSnackbar } = useSnackbar();
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const anchor = useRef();

  const handleDrag = useCallback(debounce(() => {
    enqueueSnackbar('Click on the speaker you want to link');
  }, 5000, { leading: true, trailing: false }), []);

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
          draggable
          onDrag={handleDrag}
        />
        <div className="box source-box" onClick={() => setContextMenuOpen(true)}>
          <img src={sourceLogo} alt="" className="source-logo" />
          <p className="name">{nameWithoutHiddenMeta(source.name)}</p>
          <p className="peer-name">{peer.name}</p>
          {hidden && <HiddenIndicator />}
          {source.active && <div className={styles.activeIndicator} alt="Currently playing" />}
        </div>
        <SourceContextMenu isOpen={contextMenuOpen} source={source} onClose={() => setContextMenuOpen(false)} anchor={anchor.current} />
      </div>
    </Zoom>
  );
};
