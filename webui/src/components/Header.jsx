import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import SettingsEthernetIcon from '@material-ui/icons/SettingsEthernet';

import { useShowHidden, useSetHiddenVisibility } from '../utils/useSoundSyncState';

import logo from '../res/logo_only.svg';
import { PeersListDialog } from './PeersList';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundImage: 'linear-gradient(141deg,#1f191a 0,#363636 71%,#46403f 100%)',
  },
  menuButton: {
  },
  title: {
    flexGrow: 1,
  },
}));

export const Header = () => {
  const classes = useStyles();
  const showHidden = useShowHidden();
  const setHidden = useSetHiddenVisibility();
  const [peersListOpen, setPeersListOpen] = useState(false);

  return (
    <AppBar position="static" className={classes.root}>
      <Toolbar>
        <img src={logo} className="soundsync-logo" />
        <Typography variant="h6" className={classes.title}>
          Soundsync
        </Typography>
        <IconButton
          color="inherit"
          className={classes.menuButton}
          aria-label="Show peers"
          onClick={() => setPeersListOpen(true)}
        >
          <SettingsEthernetIcon />
        </IconButton>
        <IconButton
          edge="end"
          className={classes.menuButton}
          color="inherit"
          aria-label="Show hidden"
          onClick={() => setHidden(!showHidden)}
        >
          {showHidden ? <VisibilityIcon /> : <VisibilityOffIcon />}
        </IconButton>
      </Toolbar>
      <PeersListDialog open={peersListOpen} onClose={() => setPeersListOpen(false)} />
    </AppBar>
  );
};
