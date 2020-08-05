import React, { useState, useEffect } from 'react';
import {
  makeStyles, DialogTitle, MenuItem, List, ListItemIcon, Divider, TextField, DialogContent,
} from '@material-ui/core';
import ListItemText from '@material-ui/core/ListItemText';
import airplayIcon from 'res/airplay.svg';
import { v4 as uuidv4 } from 'uuid';
import { usePeersManager } from '../../utils/useSoundSyncState';
import { Capacity } from '../../../../src/communication/peer';

const AIRPLAYSPEAKER_UPDATE_INTERVAL = 3000;

const useStyles = makeStyles(() => ({
  airplaySpeakerLogo: {
    width: 30,
  },
  airplaySpeakerItem: {
    height: 60,
  },
  scanMessage: {
    padding: 20,
  },
  hostingDeviceSelect: {
    pading: 20,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    width: 400,
    '& > *': {
      marginBottom: 10,
    },
  },
}));


export const AddAirplaySink = ({ onDialogClose }) => {
  const styles = useStyles();
  const peersManager = usePeersManager();
  const airplaySpeakerCapablePeers = peersManager.peers.filter((p) => p.state === 'connected' && p.capacities.includes(Capacity.AirplaySink));
  const [selectedAirplayPeerId, setSelectedAirplayPeerId] = useState(airplaySpeakerCapablePeers[0]?.uuid);

  const [detectedAirplaySpeakers, setDetectedAirplaySpeakers] = useState({ loading: true, airplaySpeakers: [] });

  useEffect(() => {
    if (!airplaySpeakerCapablePeers.length) {
      return;
    }
    const updateAirplaySpeakers = () => {
      airplaySpeakerCapablePeers[0].sendRcp('scanAirplay').then((airplaySpeakers) => {
        setDetectedAirplaySpeakers({ loading: false, airplaySpeakers });
      });
    };
    const intervalHandle = setInterval(updateAirplaySpeakers, AIRPLAYSPEAKER_UPDATE_INTERVAL);
    // eslint-disable-next-line consistent-return
    return () => {
      clearInterval(intervalHandle);
    };
  }, [airplaySpeakerCapablePeers.length > 0]);

  const handleAddAirplaySink = async ({ name, host, port }) => {
    const peer = peersManager.getConnectedPeerByUuid(selectedAirplayPeerId);
    if (!peer) {
      return;
    }
    await peer.sendRcp('createSink', {
      type: 'airplay',
      uuid: uuidv4(),
      available: true,
      name,
      volume: 1,
      peerUuid: peer.uuid,
      pipedFrom: null,
      host,
      port,
    });
    onDialogClose();
  };

  return (
    <>
      <DialogTitle>Connect to an Airplay Speaker</DialogTitle>
      {detectedAirplaySpeakers.loading && <p className={styles.scanMessage}>Scanning local network...</p>}
      {!detectedAirplaySpeakers.loading && !detectedAirplaySpeakers.airplaySpeakers.length && <p className={styles.scanMessage}>No Airplay speakers detected, try restarting the speaker.</p>}
      {!detectedAirplaySpeakers.loading && detectedAirplaySpeakers.airplaySpeakers.length
        && (
        <>
          <DialogContent>
            <div className={styles.form}>
              <TextField
                select
                label="Hosting device (needs to be on when using the integration)"
                required
                value={selectedAirplayPeerId}
                onChange={(e) => setSelectedAirplayPeerId(e.target.value)}
                variant="outlined"
                className={styles.hostingDeviceSelect}
              >
                {airplaySpeakerCapablePeers.map((p) => <MenuItem key={p.uuid} value={p.uuid}>{p.name}</MenuItem>)}
              </TextField>

            </div>

          </DialogContent>
          <List>
            {detectedAirplaySpeakers.airplaySpeakers.map((airplaySpeaker, i) => (
              <>
                {i !== 0 && <Divider component="li" /> }
                <MenuItem key={airplaySpeaker.host} className={styles.airplaySpeakerItem} onClick={() => handleAddAirplaySink(airplaySpeaker)}>
                  <ListItemIcon>
                    <img className={styles.airplaySpeakerLogo} src={airplayIcon} />
                  </ListItemIcon>
                  <ListItemText primary={airplaySpeaker.name} />
                </MenuItem>
              </>
            ))}
          </List>
        </>
        )}
    </>
  );
};
