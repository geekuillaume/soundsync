import React from 'react';
import {
  makeStyles, DialogTitle, DialogContent, Button,
} from '@material-ui/core';
import spotifyIcon from '../../res/spotify.svg';
import computerIcon from '../../res/computer.svg';
import airplayIcon from '../../res/airplay.svg';

const useStyles = makeStyles(() => ({
  typeButton: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  buttonLabel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  buttonsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridGap: 10,
    paddingBottom: 20,
  },
  sourceTypeLogo: {
    display: 'block',
    flex: 1,
    marginBottom: 15,
    marginTop: 15,
    maxHeight: 50,
  },
}));


export const SourceTypeSelection = ({ onTypeSelected }) => {
  const styles = useStyles();

  return (
    <>
      <DialogTitle>Add a new audio source</DialogTitle>
      <DialogContent className={styles.buttonsContainer}>
        <Button classes={{ label: styles.buttonLabel }} className={styles.typeButton} variant="outlined" onClick={() => onTypeSelected('librespot')}>
          <img src={spotifyIcon} alt="" className={styles.sourceTypeLogo} />
          <span>Add a Spotify player</span>
        </Button>
        <Button classes={{ label: styles.buttonLabel }} className={styles.typeButton} variant="outlined" onClick={() => onTypeSelected('shairport')}>
          <img src={airplayIcon} alt="" className={styles.sourceTypeLogo} />
          <span>Add an Airplay receiver</span>
        </Button>
        <Button classes={{ label: styles.buttonLabel }} className={styles.typeButton} variant="outlined" onClick={() => onTypeSelected('localDevice')}>
          <img src={computerIcon} alt="" className={styles.sourceTypeLogo} />
          <span>Use audio from a computer</span>
        </Button>
      </DialogContent>
    </>
  );
};
