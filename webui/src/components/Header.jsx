import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';

import { useShowHidden, useSetHiddenVisibility } from '../utils/useSoundSyncState';

import logo from '../res/logo_only.svg';

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

  return (
    <AppBar position="static" className={classes.root}>
      <Toolbar>
        <img src={logo} className="soundsync-logo" />
        <Typography variant="h6" className={classes.title}>
          Soundsync
        </Typography>
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
    </AppBar>
  );
};
