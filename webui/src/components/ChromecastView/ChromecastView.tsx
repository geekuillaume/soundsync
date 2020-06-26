/// <reference types="chromecast-caf-receiver" />
/*global cast */

import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useScript } from '../../utils/useScript';
// import { CHROMECAST_MESSAGE_NAMESPACE } from '../../../../src/utils/constants';
import logo from '../../res/logo_only.svg';
import gradients from '../../utils/gradients.json';

const GRADIENT = gradients[Math.floor(Math.random() * gradients.length)];

const useStyles = makeStyles(() => ({
  root: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    background: `linear-gradient(to top, ${GRADIENT.colors.join(', ')})`,
  },
  logoContainer: {
    backdropFilter: 'grayscale(50%)',
    borderRadius: 10,
    padding: 20,
    width: 110,
    height: 110,
  },
  logo: {
    width: 70,
    height: 70,
  },
}));

export const ChromecastView = () => {
  const styles = useStyles();
  const [loaded] = useScript('//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js');

  useEffect(() => {
    if (loaded) {
      const context = cast.framework.CastReceiverContext.getInstance();
      const options = new cast.framework.CastReceiverOptions();
      options.disableIdleTimeout = true;
      context.start(options);
    }
  }, [loaded]);

  return (
    <div className={styles.root}>
      <div className={styles.logoContainer}>
        <img src={logo} className={styles.logo} />
      </div>
    </div>
  );
};
