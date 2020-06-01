import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import {
  makeStyles, DialogTitle, ListSubheader, List, ListItem, ListItemText, ListItemAvatar,
} from '@material-ui/core';
import DevicesIcon from '@material-ui/icons/Devices';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import AdjustIcon from '@material-ui/icons/Adjust';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import { usePeersManager } from '../utils/useSoundSyncState';

const useStyles = makeStyles({
  dialog: {
    padding: 15,
  },
});

export const PeersListDialog = ({ open, onClose }) => {
  const styles = useStyles();
  const peers = usePeersManager().peers.filter((peer) => peer.state !== 'deleted');

  const connectedPeers = peers.filter((peer) => peer.state === 'connected');
  const otherPeers = peers.filter((peer) => peer.state !== 'connected');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      className={styles.dialog}
    >
      <DialogTitle>Soundsync devices</DialogTitle>
      <List>
        <ListSubheader>Connected devices</ListSubheader>
        {connectedPeers.map((peer) => (
          <ListItem key={peer.uuid} button onClick={() => console.log(peer)}>
            <ListItemAvatar>
              {peer.state === 'connected'
                ? <CheckCircleOutlineIcon />
                : peer.state === 'connecting'
                  ? <AdjustIcon />
                  : peer.state === 'deleted'
                    ? <RemoveCircleOutlineIcon />
                    : <ErrorOutlineIcon />}
            </ListItemAvatar>
            <ListItemText
              primary={peer.name}
              secondary={window.localStorage.getItem('soundsync:debug') && peer.uuid}
            />
          </ListItem>
        ))}
        {otherPeers.length !== 0 && <ListSubheader>Other devices</ListSubheader>}
        {otherPeers.map((peer) => (
          <ListItem key={peer.uuid} button onClick={() => console.log(peer)}>
            <ListItemAvatar>
              {peer.state === 'connected'
                ? <CheckCircleOutlineIcon />
                : peer.state === 'connecting'
                  ? <AdjustIcon />
                  : peer.state === 'deleted'
                    ? <RemoveCircleOutlineIcon />
                    : <ErrorOutlineIcon />}
            </ListItemAvatar>
            <ListItemText
              primary={peer.name}
              secondary={window.localStorage.getItem('soundsync:debug') && peer.uuid}
            />
          </ListItem>
        ))}
      </List>
      {window.localStorage.getItem('soundsync:debug') && <button onClick={() => { console.log(peersManager); }}>Log PeersManager</button>}
    </Dialog>
  );
};
