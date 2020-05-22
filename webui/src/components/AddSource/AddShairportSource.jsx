import React, { useState } from 'react';
import { filter } from 'lodash-es';
import {
  makeStyles, DialogTitle, DialogContent, Button, MenuItem, TextField,
} from '@material-ui/core';
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


export const AddShairportSource = ({ onDialogClose }) => {
  const styles = useStyles();
  const [shairportHostId, setShairportHostId] = useState('');
  const [shairportName, setShairportName] = useState('Soundsync');

  const peersManager = usePeersManager();
  const shairportCapablePeers = Object.values(filter(peersManager.peers, (p) => p.state === 'connected' && p.capacities.includes(Capacity.Shairport)));

  const handleAirplayCreate = () => {
    const peer = peersManager.getConnectedPeerByUuid(shairportHostId);
    if (!peer) {
      return;
    }
    peer.sendControllerMessage({
      type: 'sourceCreate',
      source: {
        type: 'shairport',
        name: shairportName,
        peerUuid: peer.uuid,
        shairportOptions: {
          name: shairportName,
        },
      },
    });
    onDialogClose();
  };

  return (
    <>
      <DialogTitle>Create a new Airplay receiver</DialogTitle>
      <DialogContent>
        <p>
          Use a computer as a Airplay receiver and stream from any Airplay compatible device. You need to choose a device to host the Airplay integration. This device will need to be on to use the Airplay integration. You can add multiple integrations.
        </p>
        <div className={styles.librespotForm}>
          <TextField
            label="Name"
            value={shairportName}
            onChange={(e) => setShairportName(e.target.value)}
            default="Soundsync"
            variant="outlined"
          />
          <TextField
            select
            label="Device"
            required
            value={shairportHostId}
            onChange={(e) => setShairportHostId(e.target.value)}
            variant="outlined"
          >
            {shairportCapablePeers.map((p) => <MenuItem key={p.uuid} value={p.uuid}>{p.name}</MenuItem>)}
          </TextField>
          <Button variant="outlined" onClick={handleAirplayCreate}>Add a Airplay player</Button>
        </div>
      </DialogContent>
    </>
  );
};
