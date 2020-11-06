/// <reference types="chromecast-caf-receiver" />
/*global cast */

import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { usePeersManager, useSinks } from 'utils/useSoundSyncState';
import { useScript } from '../../utils/useScript';
import { CHROMECAST_MESSAGE_NAMESPACE } from '../../../../src/utils/constants';
import logo from '../../res/logo_only.svg';
import gradients from '../../utils/gradients.json';
import { setConfig } from '../../../../src/coordinator/config';
import { getLocalPeer } from '../../../../src/communication/local_peer';
import { WebrtcPeer } from '../../../../src/communication/wrtc_peer';
import { createBasicInitiator } from '../../../../src/communication/initiators/basicInitiator';
import { WebAudioSink } from '../../../../src/audio/sinks/webaudio_sink';

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

let callerPeer: WebrtcPeer = null;

// This component is only loaded when starting the controller from a Chromecast
// it setup the cast receiver framework and handle messages from the caller
export const ChromecastView = () => {
  const styles = useStyles();
  const sinks = useSinks();
  const [loaded] = useScript('//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js');
  const peerManager = usePeersManager();

  useEffect(() => {
    if (loaded) {
      const context = cast.framework.CastReceiverContext.getInstance();
      const options = new cast.framework.CastReceiverOptions();
      options.disableIdleTimeout = true;

      context.addCustomMessageListener(CHROMECAST_MESSAGE_NAMESPACE, ({data}) => {
        if (data.type === 'soundsync_init' && data.data.peerName) {
          const name = `${data.data.peerName} - Chromecast`;
          setConfig((config) => {
            config.name = name;
            return config;
          });
          getLocalPeer().name = name;
        }
        if (data.type === 'initiator_message') {
          if (!callerPeer) {
            callerPeer = new WebrtcPeer({
              name: `chromecastPlaceholderForCallerPeer`,
              uuid: `chromecastPlaceholderForCallerPeer`,
              instanceUuid: 'placeholder',
              initiatorConstructor: createBasicInitiator((message) => {
                context.sendCustomMessage(CHROMECAST_MESSAGE_NAMESPACE, undefined, {
                  type: 'initiator_message',
                  data: message,
                });
              }),
            });
            peerManager.registerPeer(callerPeer);
          }
          callerPeer.initiator.handleReceiveMessage(data.data);
        }
      });

      // Synchronize Chromecast audio volume with sink volume
      const localSink = sinks.find((sink) => sink.local && sink.type === 'webaudio') as WebAudioSink;
      localSink.setWebaudioVolumeDisabled(true);

      context.addEventListener(cast.framework.system.EventType.SYSTEM_VOLUME_CHANGED, (volume) => {
        if (Math.abs(volume.data.level - localSink.volume) > 0.05) {
          // prevent float conversions from starting a infinite loop when synchronizing both volume
          localSink.updateInfo({volume: volume.data.level});
        }
      });

      localSink.on('update', (descriptor) => {
        if (descriptor.volume) {
          // @ts-ignore
          context.setSystemVolumeLevel(descriptor.volume);
        }
      });

      context.start(options);

      setTimeout(() => {
        // TODO: find a good event that indicate that we can read the system volume from here
        try {
          localSink.updateInfo({
            // @ts-ignore
            volume: context.getSystemVolume().level
          });
        } catch (e) {
          // do nothing and use the previously set volume
        }
      }, 1000);
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
