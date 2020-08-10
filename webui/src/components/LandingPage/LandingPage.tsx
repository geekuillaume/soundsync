import React, { useState } from 'react';
import {
  Link,
} from 'react-router-dom';
import {
  makeStyles,
} from '@material-ui/core/styles';
import { Header } from 'components/Header';
import { Button, Dialog } from '@material-ui/core';
import { DownloadLinks } from 'components/FirstUse/DownloadLinks';

import heroIllustration from 'res/landing_hero_illustration.svg';
import { useIsConnected } from 'utils/useSoundSyncState';

const useStyles = makeStyles((t) => ({
  root: {
    minHeight: '100vh',
    minWidth: '100vw',
    backgroundColor: t.palette.background.default,
  },
  hero: {
    margin: 'auto',
    maxWidth: t.breakpoints.values.md,
    minHeight: '50vh',
    display: 'flex',
    padding: '130px 30px 60px 30px',
    backgroundImage: `url(${heroIllustration})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: '50%',
    backgroundPosition: '100% 100%',
    marginBottom: 80,
    [t.breakpoints.down('sm')]: {
      backgroundSize: '60%',
      paddingBottom: 200,
      paddingTop: 50,
    },
  },
  headlineContainer: {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    [t.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  headline: {
    fontSize: '2.5rem',
    marginBottom: 20,
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
    alignItems: 'center',
    minHeight: '50vh',
  },
  presentationText: {
    width: '50%',
    fontSize: '1.4rem',
  },
  cta: {
  },
  soundsyncDetectedContainer: {
    marginTop: 30,
    textAlign: 'center',
  },
  compatibilityContainer: {
    backgroundColor: t.palette.primary.main,
    display: 'flex',
    padding: '80px 30px',
    alignItems: 'center',
    justifyContent: 'center',
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
  compatibilityContentContainer: {
    maxWidth: t.breakpoints.values.md,
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
      <Header showControls={false} />
      <div className={classes.hero}>
        <div className={classes.headlineContainer}>
          <h1 className={classes.headline}>Control all your speakers from a single place</h1>
          <h2 className={classes.subHeadline}>Soundsync link all your speakers, old or new, smart or dumb, from the same brand or not, to one easy-to-use interface</h2>
          {!isConnected
            && <Button onClick={handleDownloadClick} variant="contained" color="primary" size="large" className={classes.cta}>Download</Button>}
          {isConnected
          && (
          <div className={classes.soundsyncDetectedContainer}>
            <p>Soundsync detected on your network</p>
            <Link to="/controller"><Button variant="contained" color="primary">Open controller</Button></Link>
          </div>
          )}
        </div>
      </div>
      <div className={classes.presentationContainer}>
        <p className={classes.presentationText}>
          Soundsync unifies all the different speakers system into a single interface to let your enjoy your music anywhere in your home however you want. Put on a podcast in your living room while someone else listen to music in the kitchen or group all your speakers together to play your favorite songs in sync.
        </p>
      </div>
      <div className={classes.compatibilityContainer}>
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
      </div>
      <Dialog open={downloadDialogOpen} onClose={() => setDownloadDialogOpen(false)} maxWidth="sm" className={classes.dialog}>
        <DownloadLinks twoLinesLayout />
      </Dialog>
    </div>
  );
};
