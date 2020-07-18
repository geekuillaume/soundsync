import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import SettingsEthernetIcon from '@material-ui/icons/SettingsEthernet';
import Tooltip from '@material-ui/core/Tooltip';

import { useShowHidden, useSetHiddenVisibility } from '../utils/useSoundSyncState';

import GitHubIcon from '@material-ui/icons/GitHub';
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';
import logo from '../res/logo_only.svg';
import { PeersListDialog } from './PeersList';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundImage: 'linear-gradient(141deg,#1f191a 0,#363636 71%,#46403f 100%)',
  },
  menuButton: {
    color: 'white',
    '&:hover': {
      color: 'white'
    }
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
        <Tooltip title="Join the discussion on Discord" aria-label="Join the discussion on Discord">
          <IconButton
            color="inherit"
            className={classes.menuButton}
            href="https://discord.gg/j2BZ5KC"
          >
            <QuestionAnswerIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Get more information about Soundsync on Github" aria-label="Get more information about Soundsync on Github">
          <IconButton
            color="inherit"
            className={classes.menuButton}
            href="https://github.com/geekuillaume/soundsync"
          >
            <GitHubIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Show peers" aria-label="Show peers">
          <IconButton
            color="inherit"
            className={classes.menuButton}
            onClick={() => setPeersListOpen(true)}
          >
            <SettingsEthernetIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Show/Hide hidden" aria-label="Show/Hide hidden">
          <IconButton
            edge="end"
            className={classes.menuButton}
            color="inherit"
            onClick={() => setHidden(!showHidden)}
          >
            {showHidden ? <VisibilityIcon /> : <VisibilityOffIcon />}
          </IconButton>
        </Tooltip>
      </Toolbar>
      <PeersListDialog open={peersListOpen} onClose={() => setPeersListOpen(false)} />
    </AppBar>
  );
};
