import React from 'react';
import {
  makeStyles, DialogTitle, DialogContent, Button,
} from '@material-ui/core';
import computerIcon from '../../res/computer.svg';
import philipsHueLogo from '../../res/philipshuelogo.png';

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


export const SinkTypeSelection = ({ onTypeSelected }) => {
  const styles = useStyles();

  return (
    <>
      <DialogTitle>Add a new audio output</DialogTitle>
      <DialogContent className={styles.buttonsContainer}>
        <Button classes={{ label: styles.buttonLabel }} className={styles.typeButton} variant="outlined" onClick={() => onTypeSelected('localDevice')}>
          <img src={computerIcon} alt="" className={styles.sourceTypeLogo} />
          <span>Use another device</span>
        </Button>
        {/* <Button classes={{ label: styles.buttonLabel }} className={styles.typeButton} variant="outlined" onClick={() => onTypeSelected('hue')}>
          <img src={philipsHueLogo} alt="" className={styles.sourceTypeLogo} />
          <span>Use Philips Hue lights</span>
        </Button> */}
      </DialogContent>
    </>
  );
};
