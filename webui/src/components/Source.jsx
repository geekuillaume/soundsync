import React from 'react';
import classnames from 'classnames';
import { usePeer, useSources, useRegisterForPipe } from '../utils/useSoundSyncState';

import SpotifyLogo from '../res/spotify.svg';
import nullSinkLogo from '../res/null.svg';

const logos = {
  librespot: SpotifyLogo,
  null: nullSinkLogo,
};

export const Source = ({source}) => {
  const [shouldShow, isSelectedElement, registerForPipe] = useRegisterForPipe('source', source.uuid);
  const peer = usePeer(source.peerUuid);
  const sourceLogo = logos[source.type];
  const sources = useSources();
  const sourceIndex = sources.indexOf(source);

  return (
    <div
      className={classnames("source-container", !shouldShow && 'not-selectable')}
      style={{gridRow: sourceIndex + 2}}
    >
      <div
        className="handle"
        onClick={registerForPipe}
      />
      <div className="box source-box">
        <img src={sourceLogo} className="source-logo" />
        <p className="name">{source.name}</p>
        <p className="peer-name">{peer.name}</p>
      </div>
    </div>
  );
}

