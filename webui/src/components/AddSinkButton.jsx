import React, { useState } from 'react';
import AddIcon from '@material-ui/icons/Add';
import Dialog from '@material-ui/core/Dialog';
import {
  makeStyles, DialogTitle, DialogContent, Button,
} from '@material-ui/core';

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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" className={styles.dialog}>
        <DialogTitle>Add a new speaker</DialogTitle>
        <DialogContent>
          <p>
            To add a new speaker, open this page in a new web browser or download SoundSync on another computer.
          </p>
          <p className={styles.buttonContainer}>
            <Button href="https://github.com/geekuillaume/soundsync" variant="outlined">Download SoundSync</Button>
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};
