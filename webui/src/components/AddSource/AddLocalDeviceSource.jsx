import React from 'react';
import {
  makeStyles, DialogTitle, DialogContent, Button,
} from '@material-ui/core';

const useStyles = makeStyles(() => ({
  downloadButton: {
    width: '100%',
    marginTop: 20,
    marginBottom: 15,
  },
}));


export const AddLocalDeviceSource = () => {
  const styles = useStyles();

  return (
    <>
      <DialogTitle>Use computer audio</DialogTitle>
      <DialogContent>
        <p>Install SoundSync on Linux computer (Windows and MacOS not yet supported) to use this computer audio output on any speakers.</p>
        <Button className={styles.downloadButton} href="https://github.com/geekuillaume/soundsync" variant="outlined">Download SoundSync</Button>
      </DialogContent>
    </>
  );
};
