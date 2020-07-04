import React, { useState } from 'react';
import {
  makeStyles, DialogTitle, DialogContent, Button, MenuItem, TextField,
} from '@material-ui/core';
import { v4 as uuidv4 } from 'uuid';
import { usePeersManager } from '../../utils/useSoundSyncState';
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
  const librespotCapablePeers = peersManager.peers.filter((p) => p.state === 'connected' && p.capacities.includes(Capacity.Librespot));

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
        uuid: uuidv4(),
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
          Add a new Spotify receiver and control the playback from the Spotify App on your mobile or desktop. You can add multiple Spotify integrations. You need a premium Spotify account to use this integration.
        </p>
        <div className={styles.librespotForm}>
          <TextField
            label="Name (shown on Spotify apps)"
            value={librespotName}
            onChange={(e) => setLibrespotName(e.target.value)}
            default="Spotify"
            variant="outlined"
          />
          <TextField
            select
            label="Hosting device (needs to be on when using the integration)"
            required
            value={librespotHostId}
            onChange={(e) => setLibrespotHostId(e.target.value)}
            variant="outlined"
          >
            {librespotCapablePeers.map((p) => <MenuItem key={p.uuid} value={p.uuid}>{p.name}</MenuItem>)}
          </TextField>
          <p>You can link the integration to a Spotify User to stream when not connected to your local network. This is optionnal and the login informations won't quit your device.</p>
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
