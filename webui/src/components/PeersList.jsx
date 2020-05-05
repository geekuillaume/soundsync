import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import {
  makeStyles, DialogTitle, DialogContent, List, ListItem, ListItemText, ListItemAvatar,
} from '@material-ui/core';
import DevicesIcon from '@material-ui/icons/Devices';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import AdjustIcon from '@material-ui/icons/Adjust';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import { usePeers, usePeersManager } from '../utils/useSoundSyncState';

const useStyles = makeStyles({
  dialog: {
    padding: 15,
  },
});

export const PeersListDialog = ({ open, onClose }) => {
  const styles = useStyles();
  const peersManager = usePeersManager();
  const peers = Object.values(peersManager.peers);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" className={styles.dialog}>
      <DialogTitle>Soundsync devices</DialogTitle>
      <DialogContent>
        <List>
          {peers.map((peer) => (
            <ListItem key={peer.uuid}>
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
                secondary={peer.uuid}
              />
            </ListItem>
          ))}
        </List>
        <button onClick={() => { console.log(peersManager); }}>Log PeersManager</button>
      </DialogContent>
    </Dialog>

  );
};
