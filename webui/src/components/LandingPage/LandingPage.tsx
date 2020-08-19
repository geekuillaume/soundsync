import React, { useLayoutEffect } from 'react';
import {
  Link,
} from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Typography } from '@material-ui/core';

import { useIsConnected } from 'utils/useSoundSyncState';
import { LandingCompatibility } from 'components/LandingPage/LandingCompatibility';
import { LandingPresentation } from 'components/LandingPage/Presentation';
import { LandingDownload } from 'components/LandingPage/LandingDownload';
import Logo from 'res/logo_only.svg';
import { LandingFAQ } from 'components/LandingPage/LandingFAQ';
import { LandingFooter } from 'components/LandingPage/LandingFooter';

const useStyles = makeStyles((t) => ({
  root: {
    minHeight: '100vh',
    minWidth: '100vw',
    backgroundColor: t.palette.background.default,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  headerTitleContainer: {
    display: 'flex',
    color: 'white',
    width: t.breakpoints.values.md,
    margin: 'auto',
    maxWidth: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  betaIndicator: {
    fontSize: '0.6em',
    transform: 'translateY(-10px)',
    display: 'inline-block',
  },
  hero: {
    minHeight: '60vh',
    display: 'flex',
    padding: '130px 30px',
    // background: 'linear-gradient(225deg, #00163A, #0063E6)',
    backgroundImage: 'radial-gradient(circle at bottom right, rgb(52, 33, 141) 0%, rgb(52, 33, 141) 20%,rgb(52, 50, 168) 20%, rgb(52, 50, 168) 40%,rgb(52, 68, 195) 40%, rgb(52, 68, 195) 60%,rgb(52, 85, 221) 60%, rgb(52, 85, 221) 80%,rgb(52, 102, 248) 80%, rgb(52, 102, 248) 100%);',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineContainer: {
    width: t.breakpoints.values.md,
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    color: t.palette.common.white,
    [t.breakpoints.down('sm')]: {
      width: '100%',
    },
    fontFamily: '\'Sora\', sans-serif',
  },
  headline: {
    fontSize: '3rem',
    marginBottom: 20,
    fontWeight: 200,
    '& span': {
      fontWeight: 400,
      display: 'block',
    },
  },
  cta: {
    backgroundColor: 'black',
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgb(20,20,20)',
    },
  },
  subHeadline: {
    fontSize: '1.5rem',
    color: t.palette.grey[600],
    marginBottom: 20,
  },
  compatibilityIntro: {
    width: '100%',
    padding: '0 30px',
    maxWidth: t.breakpoints.values.sm,
    margin: 'auto',
    textAlign: 'center',
    marginTop: 70,
    marginBottom: 30,
    fontSize: '1.2em',
    fontFamily: '\'Sora\', sans-serif',
  },
}));


export const LandingPage = () => {
  const classes = useStyles();
  const isConnected = useIsConnected();

  const scrollToDownload = () => {
    document.getElementById('download').scrollIntoView({
      behavior: 'smooth',
    });
  };

  useLayoutEffect(() => {
    if (document.location.hash === '#download') {
      scrollToDownload();
    }
  }, []);

  return (
    <div className={classes.root}>
      <div className={classes.hero}>
        <div className={classes.header}>
          <div className={classes.headerTitleContainer}>
            <img src={Logo} className="soundsync-logo" />

            <Typography variant="h6" className={classes.title}>
              Soundsync
              {' '}
              <span className={classes.betaIndicator}>BETA</span>
            </Typography>

          </div>
        </div>
        <div className={classes.headlineContainer}>
          <h1 className={classes.headline}>
            Control all your speakers
            {' '}
            <span>from a single place</span>
          </h1>
          {!isConnected
            && <Button onClick={scrollToDownload} variant="contained" size="large" className={classes.cta}>Download</Button>}
          {isConnected
          && (
            <Link to="/controller"><Button variant="contained" size="large" className={classes.cta}>Open controller</Button></Link>
          )}
        </div>
      </div>

      <LandingPresentation />

      <p className={classes.compatibilityIntro}>
        Soundsync unifies all the different speakers systems into a single interface to let your enjoy your music anywhere in your home, however you want. Put on a podcast in your living room while someone else listens to music in the kitchen; or group all your speakers together to play your favorite song in sync.
      </p>

      <LandingCompatibility />

      <LandingDownload />

      <LandingFAQ />

      <LandingFooter />
    </div>
  );
};
