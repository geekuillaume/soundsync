import React, { useState } from 'react';
import {
  Link,
} from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
// import { Header } from 'components/Header';
import { Button, Dialog } from '@material-ui/core';
import { DownloadLinks } from 'components/FirstUse/DownloadLinks';

// import heroIllustration from 'res/landing_hero_illustration.svg';
import { useIsConnected } from 'utils/useSoundSyncState';
import { LandingCompatibility } from 'components/LandingPage/LandingCompatibility';

const useStyles = makeStyles((t) => ({
  root: {
    minHeight: '100vh',
    minWidth: '100vw',
    backgroundColor: t.palette.background.default,
  },
  hero: {
    minHeight: '60vh',
    display: 'flex',
    padding: '130px 30px',
    background: 'linear-gradient(225deg, #00163A, #0064E7)',
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
    marginTop: 20,
  },
  downloadContainer: {
    backgroundColor: t.palette.secondary.main,
    display: 'flex',
    padding: '80px 30px',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqContainer: {
    backgroundColor: t.palette.primary.main,
    display: 'flex',
    padding: '80px 30px',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutContainer: {
    backgroundColor: t.palette.secondary.main,
    display: 'flex',
    padding: '80px 30px',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadContentContainer: {
    maxWidth: t.breakpoints.values.md,
  },
  faqContentContainer: {
    maxWidth: t.breakpoints.values.md,
  },
  aboutContentContainer: {
    maxWidth: t.breakpoints.values.md,
  },
}));


export const LandingPage = () => {
  const classes = useStyles();
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const isConnected = useIsConnected();

  const handleDownloadClick = () => {
    setDownloadDialogOpen(true);
  };

  return (
    <div className={classes.root}>
      <div className={classes.hero}>
        <div className={classes.headlineContainer}>
          <h1 className={classes.headline}>
            Control all your speakers
            {' '}
            <span>from a single place</span>
          </h1>
          {!isConnected
            && <Button onClick={handleDownloadClick} variant="contained" size="large" className={classes.cta}>Download</Button>}
          {isConnected
          && (
            <Link to="/controller"><Button variant="contained" size="large" className={classes.cta}>Open controller</Button></Link>
          )}
        </div>
      </div>

      <div className={classes.presentationContainer}>
        <p className={classes.presentationText}>
          Soundsync link all your speakers, old or new, smart or dumb, from the same brand or not, to one easy-to-use interface
        </p>
        <div className={classes.presentationFeaturesContainer}>
          <div className={classes.presentationFeature}>
            <p>Open-Source</p>
          </div>
          <div className={classes.presentationFeature}>
            <p>Fully customizable</p>
          </div>
          <div className={classes.presentationFeature}>
            <p>No vendor lock-in</p>
          </div>
        </div>
      </div>

      <LandingCompatibility />
      {/* Soundsync unifies all the different speakers system into a single interface to let your enjoy your music anywhere in your home however you want. Put on a podcast in your living room while someone else listen to music in the kitchen or group all your speakers together to play your favorite songs in sync. */}

      {/* <div className={classes.compatibilityContainer}>
        <div className={classes.compatibilityContentContainer}>
          COMPATIBLITY
        </div>
      </div>
      <div className={classes.downloadContainer}>
        <div className={classes.downloadContentContainer}>
          DOWNLOAD + instructions
        </div>
      </div>
      <div className={classes.faqContainer}>
        <div className={classes.faqContentContainer}>
          FAQ
        </div>
      </div>
      <div className={classes.aboutContainer}>
        <div className={classes.aboutContentContainer}>
          About
        </div>
      </div> */}
      <Dialog open={downloadDialogOpen} onClose={() => setDownloadDialogOpen(false)} maxWidth="sm" className={classes.dialog}>
        <DownloadLinks twoLinesLayout />
      </Dialog>
    </div>
  );
};
