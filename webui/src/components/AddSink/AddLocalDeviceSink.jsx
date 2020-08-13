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
        <p>Install Soundsync on your computer to use its speakers with Soundsync.</p>
        <Link to="/landing#download"><Button className={styles.downloadButton} variant="outlined">Download Soundsync</Button></Link>
      </DialogContent>
    </>
  );
};
