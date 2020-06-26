import React, { useState, useEffect } from 'react';
import {
  makeStyles, DialogTitle, MenuItem, List, ListItemIcon, Divider,
} from '@material-ui/core';
import ListItemText from '@material-ui/core/ListItemText';
import { usePeersManager } from '../../utils/useSoundSyncState';
import { Capacity } from '../../../../src/communication/peer';
import chromecastLogo from '../../res/chromecast.png';

const CHROMECAST_UPDATE_INTERVAL = 3000;

const useStyles = makeStyles(() => ({
  chromecastLogo: {
    width: 30,
  },
  chromecastItem: {
    height: 60,
  },
  scanMessage: {
    padding: 20,
  },
}));


export const AddChromecastPeer = ({ onDialogClose }) => {
  const styles = useStyles();
  const peersManager = usePeersManager();
  const chromecastCapablePeers = peersManager.peers.filter((p) => p.state === 'connected' && p.capacities.includes(Capacity.ChromecastInteraction));

  const [detectedChromecasts, setDetectedChromecasts] = useState({ loading: true, chromecasts: [] });

  useEffect(() => {
    if (!chromecastCapablePeers.length) {
      return;
    }
    const updateChromecasts = () => {
      chromecastCapablePeers[0].sendRcp('scanChromecast').then((chromecasts) => {
        setDetectedChromecasts({ loading: false, chromecasts });
      });
    };
    const intervalHandle = setInterval(updateChromecasts, CHROMECAST_UPDATE_INTERVAL);
    // eslint-disable-next-line consistent-return
    return () => {
      clearInterval(intervalHandle);
    };
  }, [chromecastCapablePeers.length > 0]);

  const handleStartChromecast = async (host) => {
    if (!chromecastCapablePeers.length) {
      return;
    }
    chromecastCapablePeers[0].sendRcp('startChromecast', host);
    onDialogClose();
  };

  return (
    <>
      <DialogTitle>Connect to a Chromecast</DialogTitle>
      {detectedChromecasts.loading && <p className={styles.scanMessage}>Scanning local network...</p>}
      {!detectedChromecasts.loading && !detectedChromecasts.chromecasts.length && <p className={styles.scanMessage}>No chromecast detected.</p>}
      {!detectedChromecasts.loading && detectedChromecasts.chromecasts.length
        && (
        <List>
          {detectedChromecasts.chromecasts.map((chromecast, i) => (
            <>
              {i !== 0 && <Divider component="li" /> }
              <MenuItem key={chromecast.host} className={styles.chromecastItem} onClick={() => handleStartChromecast(chromecast.host)}>
                <ListItemIcon>
                  <img className={styles.chromecastLogo} src={chromecastLogo} />
                </ListItemIcon>
                <ListItemText primary={chromecast.name} />
              </MenuItem>
            </>
          ))}
        </List>
        )}
    </>
  );
};
