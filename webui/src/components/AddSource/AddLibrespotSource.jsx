import React, { useState } from 'react';
import { filter } from 'lodash-es';
import {
  makeStyles, DialogTitle, DialogContent, Button, MenuItem, TextField,
} from '@material-ui/core';
import { usePeers } from '../../utils/useSoundSyncState';
import { Capacity } from '../../../../src/communication/peer';

const useStyles = makeStyles(() => ({
  formControl: {
    minWidth: 200,
    flex: 1,
    marginRight: 10,
  },
  librespotForm: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    marginTop: 20,
    '& > *': {
      marginBottom: 10,
    },
  },
}));


export const AddLibrespotSource = ({ onDialogClose }) => {
  const styles = useStyles();
  const [librespotHostId, setLibrespotHostId] = useState('');
  const [librespotName, setLibrespotName] = useState('Spotify on Soundsync');
  const [librespotUsername, setLibrespotUsername] = useState('');
  const [librespotPassword, setLibrespotPassword] = useState('');

  const peersManager = usePeersManager();
  const librespotCapablePeers = Object.values(filter(peersManager.peers, (p) => p.state === 'connected' && p.capacities.includes(Capacity.Shairport)));

  const handleLibrespotCreate = () => {
    const peer = peersManager.getConnectedPeerByUuid(librespotHostId);
    if (!peer) {
      return;
    }
    peer.sendControllerMessage({
      type: 'sourceCreate',
      source: {
        type: 'librespot',
        name: librespotName,
        peerUuid: peer.uuid,
        librespotOptions: {
          name: librespotName,
          ...(librespotUsername && librespotPassword && {
            username: librespotUsername,
            password: librespotPassword,
          }),
        },
      },
    });
    onDialogClose();
  };

  return (
    <>
      <DialogTitle>Add a new Spotify source</DialogTitle>
      <DialogContent>
        <p>
          Use a computer as a Spotify player and control the playback from the Spotify App on your mobile or desktop. You need to choose a device to host the Spotify integration. This device will need to be on to use the Spotify integration. You can add multiple Spotify integrations. You can specify a Spotify account if you want to use this integration without needing to be connected to the same local network as Soundsync.
        </p>
        <div className={styles.librespotForm}>
          <TextField
            label="Name"
            value={librespotName}
            onChange={(e) => setLibrespotName(e.target.value)}
            default="Spotify"
            variant="outlined"
          />
          <TextField
            select
            label="Device"
            required
            value={librespotHostId}
            onChange={(e) => setLibrespotHostId(e.target.value)}
            variant="outlined"
          >
            {librespotCapablePeers.map((p) => <MenuItem key={p.uuid} value={p.uuid}>{p.name}</MenuItem>)}
          </TextField>
          <TextField
            label="Spotify Username"
            value={librespotUsername}
            onChange={(e) => setLibrespotUsername(e.target.value)}
            variant="outlined"
          />
          <TextField
            type="password"
            label="Spotify Password"
            value={librespotPassword}
            onChange={(e) => setLibrespotPassword(e.target.value)}
            variant="outlined"
          />
          <Button variant="outlined" onClick={handleLibrespotCreate}>Add a Spotify player</Button>
        </div>
      </DialogContent>
    </>
  );
};
