import React from 'react';
import {
  makeStyles, DialogTitle, DialogContent, Button,
} from '@material-ui/core';
import { Link } from 'react-router-dom';

const useStyles = makeStyles(() => ({
  downloadButton: {
    width: '100%',
    marginTop: 20,
    marginBottom: 15,
  },
}));


export const AddLocalDeviceSink = () => {
  const styles = useStyles();

  return (
    <>
      <DialogTitle>Use computer audio</DialogTitle>
      <DialogContent>
        <p>Install Soundsync on your computer to use its speakers with Soundsync. Once installed and started, every audio output on this computer will automatically show in the controller.</p>
        <p>
          You can also open
          {' '}
          <a href="https://soundsync.app">soundsync.app</a>
          {' '}
          in a web browser on another device connected to your wifi to use this device with Soundsync.
        </p>
        <Link to="/landing#download"><Button className={styles.downloadButton} variant="outlined">Download Soundsync</Button></Link>
      </DialogContent>
    </>
  );
};
