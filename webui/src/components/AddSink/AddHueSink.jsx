import React, { useState, useEffect } from 'react';
import { find } from 'lodash';
import {
  makeStyles, DialogTitle, DialogContent, Button, MenuItem, TextField,
} from '@material-ui/core';
import { v4 as uuidv4 } from 'uuid';
import ListItemText from '@material-ui/core/ListItemText';
import { usePeersManager } from '../../utils/useSoundSyncState';
import { Capacity } from '../../../../src/communication/peer';

const useStyles = makeStyles(() => ({
  formControl: {
    minWidth: 200,
    flex: 1,
    marginRight: 10,
  },
  hueForm: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    marginTop: 20,
    '& > *': {
      marginBottom: 10,
    },
  },
}));


export const AddHueSink = ({ onDialogClose }) => {
  const styles = useStyles();
  const peersManager = usePeersManager();
  const hueCapablePeers = peersManager.peers.filter((p) => p.state === 'connected' && p.capacities.includes(Capacity.Hue));

  const [hueBridges, setHueBridges] = useState({ loading: true, bridges: [] });
  const [hueEntertainmentZones, setHueEntertainmentZones] = useState([]);

  const [selectedHueHostId, setSelectedHueHostId] = useState(hueCapablePeers[0]?.uuid);
  const [selectedHueBridgeHost, setSelectedHueBridgeHost] = useState('');
  const [selectedHueEntertainmentZoneId, setSelectedHueEntertainmentZoneId] = useState('');
  const [userActionNeededForAuth, setUserActionNeededForAuth] = useState(false);

  useEffect(() => {
    if (!hueCapablePeers.length) {
      return;
    }
    hueCapablePeers[0].sendRcp('hueScan', null).then((bridges) => {
      setHueBridges({ loading: false, bridges });
      setSelectedHueBridgeHost((val) => val || bridges[0]?.ip);
    });
  }, [hueCapablePeers.length > 0]);
  useEffect(() => {
    if (!selectedHueBridgeHost || !hueCapablePeers.length || !selectedHueHostId) {
      setHueEntertainmentZones([]);
      return;
    }
    const peer = peersManager.getConnectedPeerByUuid(selectedHueHostId);
    if (!peer) {
      setHueEntertainmentZones([]);
      return;
    }
    const userActionNeededTimeout = setTimeout(() => {
      setUserActionNeededForAuth(true);
    }, 2000); // if no response after 2s, we can assume the peer is trying to authenticate and needs a user interaction to do so
    peer.sendRcp('hueGetEntertainmentZones', selectedHueBridgeHost).then((zones) => {
      clearTimeout(userActionNeededTimeout);
      setUserActionNeededForAuth(false);
      setHueEntertainmentZones(zones);
      setSelectedHueEntertainmentZoneId((val) => val || zones[0]?.id);
    });
    return () => {
      clearTimeout(userActionNeededTimeout);
    }
  }, [selectedHueBridgeHost]);

  const handleCreateHueSink = async () => {
    const peer = peersManager.getConnectedPeerByUuid(selectedHueHostId);
    if (!peer || !selectedHueBridgeHost || !selectedHueBridgeHost || !selectedHueEntertainmentZoneId) {
      return;
    }
    await peer.sendRcp('createSink', {
      type: 'huelight',
      uuid: uuidv4(),
      available: true,
      name: find(hueEntertainmentZones, { id: selectedHueEntertainmentZoneId }).name,
      volume: 1,
      peerUuid: peer.uuid,
      pipedFrom: null,
      hueHost: selectedHueBridgeHost,
      entertainmentZoneId: selectedHueEntertainmentZoneId,
    });
    onDialogClose();
  };

  return (
    <>
      <DialogTitle>Connect to a Philips Hue Bridge</DialogTitle>
      <DialogContent>
        <p>
          Use Philips Hue as light visualization for your music.
        </p>
        <div className={styles.hueForm}>
          <TextField
            select
            label="Device"
            required
            value={selectedHueHostId}
            onChange={(e) => setSelectedHueHostId(e.target.value)}
            variant="outlined"
          >
            {hueCapablePeers.map((p) => <MenuItem key={p.uuid} value={p.uuid}>{p.name}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Hue bridge"
            required
            value={selectedHueBridgeHost}
            onChange={(e) => setSelectedHueBridgeHost(e.target.value)}
            variant="outlined"
          >
            {hueBridges.bridges.map((bridge) => (
              <MenuItem key={bridge.ip} value={bridge.ip}>
                <ListItemText primary={bridge.name} secondary={bridge.ip} />
              </MenuItem>
            ))}
          </TextField>
          {userActionNeededForAuth && <div>Soundsync is connecting to your Philips Hue Bridge. To continue, please press the button on the top of the bridge device.</div>}
          <TextField
            select
            label="Zone"
            required
            value={selectedHueEntertainmentZoneId}
            onChange={(e) => setSelectedHueEntertainmentZoneId(e.target.value)}
            variant="outlined"
          >
            {hueEntertainmentZones.map((zone) => (
              <MenuItem key={zone.id} value={zone.id}>
                <ListItemText primary={zone.name} secondary={`${zone.lights.length} lights`} />
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" onClick={handleCreateHueSink}>Connect</Button>
        </div>
      </DialogContent>
    </>
  );
};
