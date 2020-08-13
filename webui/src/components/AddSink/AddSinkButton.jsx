import React, { useState } from 'react';
import AddIcon from '@material-ui/icons/Add';
import Dialog from '@material-ui/core/Dialog';
import {
  makeStyles, Button,
} from '@material-ui/core';
import { AddLocalDeviceSink } from 'components/AddSink/AddLocalDeviceSink';
import { DownloadLinks } from '../FirstUse/DownloadLinks';
import { SinkTypeSelection } from './SinkTypeSelection';
import { AddHueSink } from './AddHueSink';
import { AddChromecastPeer } from './AddChromecastSink';
import { AddAirplaySink } from './AddAirplaySink';

const useStyles = makeStyles({
  openDialogButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    borderRadius: 5,
    gridColumn: 3,
  },
  dialog: {
    padding: 15,
  },
  buttonContainer: {
    textAlign: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
});

export const AddSinkButton = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const styles = useStyles();

  return (
    <>
      <Button className={styles.openDialogButton} onClick={() => setDialogOpen(true)}>
        <AddIcon fontSize="large" />
      </Button>
      <Dialog open={Boolean(dialogOpen)} onClose={() => setDialogOpen(false)} maxWidth="sm" className={styles.dialog}>
        {dialogOpen === true && <SinkTypeSelection onTypeSelected={setDialogOpen} />}
        {dialogOpen === 'localDevice' && <AddLocalDeviceSink />}
        {dialogOpen === 'hue' && <AddHueSink onDialogClose={() => setDialogOpen(false)} />}
        {dialogOpen === 'chromecast' && <AddChromecastPeer onDialogClose={() => setDialogOpen(false)} />}
        {dialogOpen === 'airplay' && <AddAirplaySink onDialogClose={() => setDialogOpen(false)} />}
      </Dialog>
    </>
  );
};
