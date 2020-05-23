import React, { useState } from 'react';
import AddIcon from '@material-ui/icons/Add';
import Dialog from '@material-ui/core/Dialog';
import {
  makeStyles, DialogTitle, DialogContent, Button,
} from '@material-ui/core';
import { DownloadLinks } from './FirstUse/DownloadLinks';

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
          <DownloadLinks twoLinesLayout />
        </DialogContent>
      </Dialog>
    </>
  );
};
