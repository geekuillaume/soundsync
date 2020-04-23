import React, { useState } from 'react';
import AddIcon from '@material-ui/icons/Add';
import Dialog from '@material-ui/core/Dialog';
import {
  makeStyles, Button,
} from '@material-ui/core';
import { SourceTypeSelection } from './SourceTypeSelection';
import { AddLibrespotSource } from './AddLibrespotSource';
import { AddLocalDeviceSource } from './AddLocalDeviceSource';

const useStyles = makeStyles(() => ({
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
}));

export const AddSourceButton = () => {
  const styles = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClose = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Button className={styles.openDialogButton} onClick={() => setDialogOpen(true)}>
        <AddIcon fontSize="large" />
      </Button>
      <Dialog open={!!dialogOpen} onClose={handleClose} maxWidth="sm" className={styles.dialog}>
        {dialogOpen === true && <SourceTypeSelection onTypeSelected={setDialogOpen} />}
        {dialogOpen === 'librespot' && <AddLibrespotSource onDialogClose={handleClose} />}
        {dialogOpen === 'localDevice' && <AddLocalDeviceSource onDialogClose={handleClose} />}
      </Dialog>
    </>
  );
};
