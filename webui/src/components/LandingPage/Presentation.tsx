import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import OpenSourceIcon from './icons/open-source.svg';
import UnlockIcon from './icons/unlock.svg';
import NetworkIcon from './icons/network.svg';

const useStyles = makeStyles((t) => ({
  presentationContainer: {
    margin: 'auto',
    maxWidth: t.breakpoints.values.md,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginTop: -60,
    marginBottom: 60,
    padding: '60px 80px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    borderRadius: 2,
    alignItems: 'stretch',
  },
  presentationText: {
    color: '#0060dd',
    fontSize: '1.4rem',
    textAlign: 'center',
    fontFamily: '\'Sora\', sans-serif',
  },
  presentationFeaturesContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    textAlign: 'center',
    marginTop: 40,
  },
  presentationFeatureImage: {
    width: 80,
    height: 80,
  },
}));


export const LandingPresentation = () => {
  const classes = useStyles();

  return (
    <div className={classes.presentationContainer}>
      <p className={classes.presentationText}>
        Soundsync link all your speakers, old or new, smart or dumb, from the same brand or not, to one easy-to-use interface
      </p>
      <div className={classes.presentationFeaturesContainer}>
        <div className={classes.presentationFeature}>
          <img src={OpenSourceIcon} className={classes.presentationFeatureImage} />
          <p>Open-Source</p>
        </div>
        <div className={classes.presentationFeature}>
          <img src={NetworkIcon} className={classes.presentationFeatureImage} />
          <p>Fully customizable</p>
        </div>
        <div className={classes.presentationFeature}>
          <img src={UnlockIcon} className={classes.presentationFeatureImage} />
          <p>No vendor lock-in</p>
        </div>
      </div>
    </div>
  );
};
