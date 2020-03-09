import React, { useState } from 'react';
import { filter } from 'lodash-es';
import AddIcon from '@material-ui/icons/Add';
import Dialog from '@material-ui/core/Dialog';
import {
  makeStyles, DialogTitle, DialogContent, Button, Divider, Typography, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, FormControl, InputLabel, Select, MenuItem,
} from '@material-ui/core';
import { usePeers } from '../utils/useSoundSyncState';
import { Capacity } from '../serverSrc/communication/peer';

const useStyles = makeStyles((theme) => ({
  openDialogButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    borderRadius: 5,
    gridColumn: 1,
  },
  dialog: {
    padding: 15,
  },
  divider: {
    marginTop: 15,
    marginBottom: 15,
  },
  buttonContainer: {
    textAlign: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
  formControl: {
    minWidth: 200,
    flex: 1,
    marginRight: 10,
  },
  librespotForm: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: 10,
  },
}));

export const AddSourceButton = () => {
  const styles = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [librespotHostId, setLibrespotHostId] = useState('');

  const peers = usePeers();
  const librespotCapablePeers = Object.values(filter(peers, (p) => p.capacities.includes(Capacity.Librespot)));

  const handleLibrespotCreate = () => {
    const peer = peers[librespotHostId];
    if (!peer) {
      return;
    }
    peer.sendControllerMessage({
      type: 'sourceCreate',
      source: {
        type: 'librespot',
        name: 'Spotify',
        peerUuid: peer.uuid,
        librespotOptions: {
          name: 'Soundsync',
        },
      },
    });
    setDialogOpen(false);
  };

  return (
    <>
      <Button className={styles.openDialogButton} onClick={() => setDialogOpen(true)}>
        <AddIcon fontSize="large" />
      </Button>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" className={styles.dialog}>
        <DialogTitle>Add a new audio source</DialogTitle>
        <DialogContent>
          <p>
            Use a computer as a Spotify player and control the playback from the Spotify App on your mobile or desktop. You need to choose a device to host the Spotify integration. This device will need to be on to use the Spotify integration. You can add multiple Spotify integrations.
          </p>
          <div className={styles.librespotForm}>
            <FormControl className={styles.formControl}>
              <InputLabel id="librespothost-label">Device</InputLabel>
              <Select
                value={librespotHostId}
                required
                labelId="librespothost-label"
                onChange={(e) => setLibrespotHostId(e.target.value)}
              >
                {librespotCapablePeers.map((p) => <MenuItem key={p.uuid} value={p.uuid}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={handleLibrespotCreate}>Add a Spotify player</Button>
          </div>
          <Divider className={styles.divider} />
          <p>Install SoundSync on a Windows computer to use this computer audio output on any speakers.</p>
          <p className={styles.buttonContainer}>
            <Button href="https://github.com/geekuillaume/soundsync" variant="outlined">Download SoundSync</Button>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};
