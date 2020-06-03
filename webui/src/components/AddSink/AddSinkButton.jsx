import React, { useState } from 'react';
import AddIcon from '@material-ui/icons/Add';
import Dialog from '@material-ui/core/Dialog';
import {
  makeStyles, DialogTitle, DialogContent, Button,
} from '@material-ui/core';
import { DownloadLinks } from '../FirstUse/DownloadLinks';
import { SinkTypeSelection } from './SinkTypeSelection';
import { AddHueSink } from './AddHueSink';

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
        {dialogOpen === 'localDevice' && <DownloadLinks twoLinesLayout />}
        {dialogOpen === 'hue' && <AddHueSink onDialogClose={() => setDialogOpen(false)} />}
        {/* <DialogContent>
          <p>
            Open
            {' '}
            <a href="https://soundsync.app/">soundsync.app</a>
            {' '}
            on another web browser or install the App on a new device:
          </p>
          <DownloadLinks twoLinesLayout />
        </DialogContent> */}
      </Dialog>
    </>
  );
};
