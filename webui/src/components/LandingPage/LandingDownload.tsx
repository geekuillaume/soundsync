import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import { DOWNLOAD_LINKS_TARGETS } from 'components/FirstUse/DownloadLinks';
import { Tooltip } from '@material-ui/core';
import WindowsIcon from './icons/windows.svg';
import MacOsIcon from './icons/macos.svg';
import LinuxIcon from './icons/linux.svg';
import RaspberryIcon from './icons/raspberry.svg';

const useStyles = makeStyles((t) => ({
  downloadContainer: {
    contain: 'layout style paint',
    margin: 'auto',
    maxWidth: t.breakpoints.values.md,

    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(225deg, #00163A, #0064E7)',

    padding: '60px 30px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    borderRadius: 15,
    [t.breakpoints.down('sm')]: {
      borderRadius: 0,
    },
  },
  downloadTitle: {
    color: t.palette.common.white,
    fontSize: '1.4rem',
    textAlign: 'center',
    fontFamily: '\'Sora\', sans-serif',
  },
  downloadButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    width: '100%',
    marginTop: 30,
  },
  downloadButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    margin: 10,
    color: t.palette.common.white,
    textAlign: 'center',
    '& p': {
      letterSpacing: '1.2px',
      [t.breakpoints.down('sm')]: {
        display: 'none',
      },
    },
  },
  downloadImageContainer: {
    padding: 30,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,.2)',
    lineHeight: 0,
    marginBottom: 15,
    [t.breakpoints.down('sm')]: {
      padding: 5,
    },
  },
  downloadImage: {
    width: 80,
    maxHeight: 80,
  },
  linuxDownloadLinks: {
    textAlign: 'center',
    padding: '15px 10px',
    lineHeight: 2,
    '& a': {
      color: 'white',
      fontSize: '1.5em',
      textDecoration: 'underline',
    },
  },
}));


export const LandingDownload = () => {
  const classes = useStyles();

  const linuxDownloadLinks = (
    <div className={classes.linuxDownloadLinks}>
      <p><a href={DOWNLOAD_LINKS_TARGETS.linuxDeb}>.deb for Ubuntu/Debian</a></p>
      <p><a href={DOWNLOAD_LINKS_TARGETS.linuxPacman}>.pacman for Archlinux</a></p>
    </div>
  );

  return (
    <div className={classes.downloadContainer} id="download">
      <p className={classes.downloadTitle}>
        Download
      </p>
      <div className={classes.downloadButtons}>
        <div className={classes.downloadButton}>
          <a href={DOWNLOAD_LINKS_TARGETS.windows}>
            <div className={classes.downloadImageContainer}>
              <img className={classes.downloadImage} src={WindowsIcon} />
            </div>
          </a>
          <p>Windows</p>
        </div>
        <div className={classes.downloadButton}>
          <a href={DOWNLOAD_LINKS_TARGETS.macos}>

            <div className={classes.downloadImageContainer}>
              <img className={classes.downloadImage} src={MacOsIcon} />
            </div>
          </a>
          <p>MacOS</p>
        </div>
        <div className={classes.downloadButton}>
          <Tooltip title={linuxDownloadLinks} interactive arrow>
            <div className={classes.downloadImageContainer}>
              <img className={classes.downloadImage} src={LinuxIcon} />
            </div>
          </Tooltip>
          <p>Linux</p>
        </div>
        <div className={classes.downloadButton}>
          <a href={DOWNLOAD_LINKS_TARGETS.armDeb}>
            <div className={classes.downloadImageContainer}>
              <img className={classes.downloadImage} src={RaspberryIcon} />
            </div>
          </a>
          <p>RaspberryPi</p>
        </div>
      </div>
    </div>
  );
};
