import React, {
  useCallback, useEffect, createContext, useReducer, useContext,
} from 'react';

import { some, partition } from 'lodash-es';
import { createAction, handleActions } from 'redux-actions';
import produce from 'immer';
import { isHidden } from './hiddenUtils';
import { onSoundStateChange, onPeersChange } from './coordinator_communication';
import { getAudioSourcesSinksManager } from '../../../src/audio/get_audio_sources_sinks_manager';
import { getPeersManager } from '../../../src/communication/get_peers_manager';
import { PeersManager } from '../../../src/communication/peers_manager';
import { AudioSource } from '../../../src/audio/sources/audio_source';
import { AudioSink } from '../../../src/audio/sinks/audio_sink';
import { getLocalPeer } from '../../../src/communication/local_peer';
import { useSnackbar } from 'notistack';

const initialState = {
  stateVersion: 0,
  registeringForPipe: { selectedSink: null, selectedSource: null },
  showHidden: false,
};

const soundSyncContext = createContext({
  state: initialState,
  dispatch: (...args) => {},
  audioSourcesSinksManager: getAudioSourcesSinksManager(),
  peersManagers: {},
});

const stateUpdate = createAction('stateUpdate');
const registerForPipe = createAction('registerForPipe');
const unregisterForPipe = createAction('unregisterForPipe');
const changeHiddenVisibility = createAction('changeHiddenVisibility');

export const SoundSyncProvider = ({ children }) => {
  const { enqueueSnackbar } = useSnackbar();

  const [state, dispatch] = useReducer(handleActions({
    [stateUpdate.toString()]: produce((s) => {
      // used to force react refresh, the state is already in the audioSourcesSinksManager object
      s.stateVersion++;
    }),
    [registerForPipe.toString()]: produce((s, { payload }) => {
      if (payload.type === 'sink') {
        s.registeringForPipe.selectedSink = payload.audioObject;
      } else {
        s.registeringForPipe.selectedSource = payload.audioObject;
      }
    }),
    [unregisterForPipe.toString()]: produce((s) => {
      s.registeringForPipe = {};
    }),
    [changeHiddenVisibility.toString()]: produce((s, { payload }) => {
      s.showHidden = payload;
    }),
  }, initialState), initialState);

  const refreshData = useCallback(async () => {
    dispatch(stateUpdate());
  }, []);

  useEffect(() => {
    refreshData();
    onSoundStateChange(refreshData);
    onPeersChange(refreshData);
    getPeersManager().on('connectedPeer', (peer) => {
      if (peer.version !== getLocalPeer().version) {
        enqueueSnackbar(`${peer.name} is running Soundsync version ${peer.version} but last version is ${getLocalPeer().version}, please update Soundsync on this computer as this can lead to errors`, { autoHideDuration: 3000 })
      }
    })
  }, []);

  return (
    <soundSyncContext.Provider value={{
      state,
      dispatch,
      audioSourcesSinksManager: getAudioSourcesSinksManager(),
      peersManagers: getPeersManager(),
    }}
    >
      {children}
    </soundSyncContext.Provider>
  );
};

export const useIsConnected = () => some(useContext(soundSyncContext).peersManagers.peers, (peer) => !peer.isLocal && peer.state === 'connected');

const audioSourceSinkGetter = (collection) => {
  const inputCollection = Array.from(collection) as (AudioSource | AudioSink)[];
  const sortedCollection = inputCollection.sort((a, b) => a.uuid.localeCompare(b.uuid));
  const availableCollection = sortedCollection.filter((s) => s.peer && s.peer.state === 'connected' && s.available !== false);
  const [visible, hidden] = partition(availableCollection, (s) => !isHidden(s.name));
  return [...visible, ...hidden];
};

export const getContextAudioSourcesSinksManager = () => useContext(soundSyncContext).audioSourcesSinksManager;

export const useSinks = () => audioSourceSinkGetter(getContextAudioSourcesSinksManager().sinks);
export const useSources = () => audioSourceSinkGetter(getContextAudioSourcesSinksManager().sources);
export const usePipes = () => getContextAudioSourcesSinksManager().sinks.filter((s) => s.pipedFrom).map((s) => ({ sinkUuid: s.uuid, sourceUuid: s.pipedFrom }));

export const usePeersManager = () => useContext(soundSyncContext).peersManagers as PeersManager;
export const usePeers = () => useContext(soundSyncContext).peersManagers.peers;
export const usePeer = (uuid) => usePeersManager().getConnectedPeerByUuid(uuid);

export const useRegisterForPipe = (type, audioObject): [boolean, boolean, () => any] => {
  const { state, dispatch } = useContext(soundSyncContext);
  const isSelectedElement = state.registeringForPipe.selectedSink === audioObject || state.registeringForPipe.selectedSource === audioObject;
  const selectedObjectType = state.registeringForPipe.selectedSink ? 'sink' : state.registeringForPipe.selectedSource ? 'source' : null;
  const shouldShow = type !== selectedObjectType || isSelectedElement;

  useEffect(() => {
    // used to handle a click outside that will unregister the selected element
    const clickListener = (e) => {
      if (!e.target.closest('.source-container,.sink-container')) {
        dispatch(unregisterForPipe());
      }
    };
    if (isSelectedElement) {
      document.addEventListener('click', clickListener);
    }
    return () => {
      document.removeEventListener('click', clickListener);
    };
  }, [isSelectedElement]);

  return [shouldShow, isSelectedElement, () => {
    // event handler on click
    if (selectedObjectType && selectedObjectType !== type) {
      const sink = type === 'sink' ? audioObject : state.registeringForPipe.selectedSink;
      const source = type === 'source' ? audioObject : state.registeringForPipe.selectedSource;
      dispatch(unregisterForPipe());
      sink.patch({
        pipedFrom: source.uuid,
      });
      return { piped: true };
    }
    dispatch(registerForPipe({ type, audioObject }));
    return { piped: false };
  }];
};

export const useUnpipeAction = (sink) => {
  const { dispatch } = useContext(soundSyncContext);

  return useCallback(async () => {
    dispatch(unregisterForPipe());
    sink.patch({
      pipedFrom: null,
    });
  }, [sink]);
};

export const useShowHidden = () => useContext(soundSyncContext).state.showHidden;
export const useSetHiddenVisibility = () => {
  const { dispatch } = useContext(soundSyncContext);
  return (...args) => dispatch(changeHiddenVisibility(...args));
};
