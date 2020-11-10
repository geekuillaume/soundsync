import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((t) => ({
  footerContainer: {
    marginTop: 100,
    padding: '60px 30px 40px 30px',
    backgroundColor: '#000',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: -7,
      left: 0,
      right: 0,
      height: 7,
      background: 'linear-gradient(90deg, #0063e6, #0a0d55)',
    },
  },
  footerContent: {
    margin: 'auto',
    maxWidth: t.breakpoints.values.md,
    display: 'flex',
    flexDirection: 'column',
    color: 'white',
    fontSize: '1.2em',
    alignItems: 'center',
    '& a': {
      color: '#9f9f9f',
    },
    '& p': {
      marginBottom: 20,
    },
  },
}));


export const LandingFooter = () => {
  const classes = useStyles();

  return (
    <div className={classes.footerContainer}>
      <div className={classes.footerContent}>
        <p>
          <a href="mailto:guillaume+soundsync@besson.co">Contact</a>
          {' '}
          -
          {' '}
          <a href="https://github.com/geekuillaume/soundsync">GitHub</a>
          {' '}
          -
          {' '}
          <a href="https://discord.gg/j2BZ5KC">Discord</a>
        </p>
        <p>
          Made with passion in Lyon, France by Guillaume Besson - Design by
          {' '}
          <a href="https://www.thomasgrangeon.com">Thomas Grangeon</a>
        </p>
      </div>
    </div>
  );
};
