import React from 'react';
import {
  makeStyles, DialogTitle, DialogContent, Button,
} from '@material-ui/core';
import computerIcon from 'res/computer.svg';
import philipsHueLogo from 'res/philipshuelogo.png';
import chromecastLogo from 'res/chromecast.png';
import airplayIcon from 'res/airplay.svg';
import {isWebAudioAvailable} from '../../../../src/audio/sinks/webaudio_sink';

const useStyles = makeStyles((t) => ({
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
  webaudioNotAvailable: {
    gridColumn: '1 / span 2',
    marginTop: 10,
    color: t.palette.grey[700],
  }
}));


export const SinkTypeSelection = ({ onTypeSelected }) => {
  const styles = useStyles();

  return (
    <>
      <DialogTitle>Add a new audio output</DialogTitle>
      <DialogContent className={styles.buttonsContainer}>
        <Button classes={{ label: styles.buttonLabel }} className={styles.typeButton} variant="outlined" onClick={() => onTypeSelected('hue')}>
          <img src={philipsHueLogo} alt="" className={styles.sourceTypeLogo} />
          <span>Philips Hue lights</span>
        </Button>
        <Button classes={{ label: styles.buttonLabel }} className={styles.typeButton} variant="outlined" onClick={() => onTypeSelected('chromecast')}>
          <img src={chromecastLogo} alt="" className={styles.sourceTypeLogo} />
          <span>Chromecast</span>
        </Button>
        <Button classes={{ label: styles.buttonLabel }} className={styles.typeButton} variant="outlined" onClick={() => onTypeSelected('airplay')}>
          <img src={airplayIcon} alt="" className={styles.sourceTypeLogo} />
          <span>Airplay Speaker</span>
        </Button>
        <Button classes={{ label: styles.buttonLabel }} className={styles.typeButton} variant="outlined" onClick={() => onTypeSelected('localDevice')}>
          <img src={computerIcon} alt="" className={styles.sourceTypeLogo} />
          <span>Computer</span>
        </Button>
        {!isWebAudioAvailable() && document.location.protocol !== 'https' && <p className={styles.webaudioNotAvailable}>Using this browser as an audio output is not supported for this page. Please use <a href="https://soundsync.app">https://soundsync.app/</a> to use this feature.</p>}
      </DialogContent>
    </>
  );
};
