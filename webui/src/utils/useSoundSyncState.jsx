import React, {
  useCallback, useEffect, createContext, useReducer, useContext,
} from 'react';

import useFetch from 'use-http';
import { find, some, sortBy } from 'lodash-es';
import { createAction, handleActions } from 'redux-actions';
import produce from 'immer';
import { isHidden } from './hiddenUtils';
import { getSoundState, onSoundStateChange } from './coordinator_communication';
import { getAudioSourcesSinksManager } from '../serverSrc/audio/audio_sources_sinks_manager';

const initialState = {
  stateVersion: 0,
  registeringForPipe: { type: null, uuid: null },
  showHidden: false,
};

const soundSyncContext = createContext({
  state: initialState,
  dispatch: (...args) => {},
  audioSourcesSinksManager: getAudioSourcesSinksManager(),
});

const stateUpdate = createAction('stateUpdate');
const registerForPipe = createAction('registerForPipe');
const unregisterForPipe = createAction('unregisterForPipe');
const changeHiddenVisibility = createAction('changeHiddenVisibility');

export const SoundSyncProvider = ({ children }) => {
  const [state, dispatch] = useReducer(handleActions({
    [stateUpdate.toString()]: produce((s) => {
      // used to force react refresh, the state is already in the audioSourcesSinksManager object
      s.stateVersion++;
    }),
    [registerForPipe.toString()]: produce((s, { payload }) => {
      s.registeringForPipe.type = payload.type;
      s.registeringForPipe.uuid = payload.uuid;
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
  }, []);

  return (
    <soundSyncContext.Provider value={{ state, dispatch, audioSourcesSinksManager: getAudioSourcesSinksManager() }}>
      {children}
    </soundSyncContext.Provider>
  );
};

const audioSourceSinkGetter = (collection, withHidden) => {
  const orderedCollection = sortBy(collection, ({ name }) => (isHidden(name) ? 10 : 0));
  if (!withHidden) {
    return orderedCollection.filter(({ name }) => !isHidden(name));
  }
  return orderedCollection;
};

export const getContextAudioSourcesSinksManager = () => useContext(soundSyncContext).audioSourcesSinksManager;

export const useSinks = ({ withHidden = true } = {}) => audioSourceSinkGetter(getContextAudioSourcesSinksManager().sinks, withHidden);
export const useSources = ({ withHidden = true } = {}) => audioSourceSinkGetter(getContextAudioSourcesSinksManager().sources, withHidden);
export const usePipes = () => [];
export const useIsPiped = (uuid) => false;

export const usePeer = (uuid) => ({});

export const useRegisterForPipe = (type, uuid) => {
  const { post } = useFetch();

  const { state, dispatch, refreshData } = useContext(soundSyncContext);
  const isSelectedElement = state.registeringForPipe.uuid === uuid;
  const shouldShow = state.registeringForPipe.type !== type || isSelectedElement;

  useEffect(() => {
    const clickListener = (e) => {
      if (!e.target.closest('.source-container,.sink-container')) {
        dispatch(unregisterForPipe());
      }
    };
    if (state.registeringForPipe.uuid === uuid) {
      document.addEventListener('click', clickListener);
    }
    return () => {
      document.removeEventListener('click', clickListener);
    };
  }, [state.registeringForPipe.uuid === uuid]);

  return [shouldShow, isSelectedElement, async () => {
    if (state.registeringForPipe.type && state.registeringForPipe.type !== type) {
      const sourceUuid = type === 'source' ? uuid : state.registeringForPipe.uuid;
      const sinkUuid = type === 'sink' ? uuid : state.registeringForPipe.uuid;
      dispatch(unregisterForPipe());
      await post(`/source/${sourceUuid}/pipe_to_sink/${sinkUuid}`);
      refreshData();
    } else {
      dispatch(registerForPipe({ type, uuid }));
    }
  }];
};

export const useUnpipeAction = (sinkUuid) => {
  const { dispatch, refreshData } = useContext(soundSyncContext);

  const { del } = useFetch();
  const pipe = find(usePipes(), { sinkUuid });

  return useCallback(async () => {
    if (!pipe) {
      return;
    }
    dispatch(unregisterForPipe());
    await del(`/source/${pipe.sourceUuid}/pipe_to_sink/${pipe.sinkUuid}`);
    refreshData();
  }, [pipe]);
};

export const useShowHidden = () => useContext(soundSyncContext).state.showHidden;
export const useSetHiddenVisibility = () => {
  const { dispatch } = useContext(soundSyncContext);
  return (...args) => dispatch(changeHiddenVisibility(...args));
};
