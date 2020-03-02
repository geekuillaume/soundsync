import React, {
  useCallback, useEffect, createContext, useReducer, useContext,
} from 'react';

import useFetch from 'use-http';
import { find, some, sortBy } from 'lodash-es';
import { createAction, handleActions } from 'redux-actions';
import produce from 'immer';
import { isHidden } from './hiddenUtils';
import { getSoundState, onSoundStateChange } from './coordinator_communication';

const initialState = {
  soundsyncState: {},
  registeringForPipe: { type: null, uuid: null },
  showHidden: false,
};

const soundSyncContext = createContext({ state: initialState, dispatch: (...args) => {}, refreshData: () => {} });

const stateUpdate = createAction('stateUpdate');
const registerForPipe = createAction('registerForPipe');
const unregisterForPipe = createAction('unregisterForPipe');
const changeHiddenVisibility = createAction('changeHiddenVisibility');

export const SoundSyncProvider = ({ children }) => {
  const [state, dispatch] = useReducer(handleActions({
    [stateUpdate.toString()]: produce((s, { payload }) => {
      s.soundsyncState = payload;
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
    const soundState = await getSoundState();
    console.log('============', soundState);
    dispatch(stateUpdate(soundState));
  }, []);

  useEffect(() => {
    refreshData();
    onSoundStateChange(refreshData);
  }, []);

  return (
    <soundSyncContext.Provider value={{ state, dispatch, refreshData }}>
      {children}
    </soundSyncContext.Provider>
  );
};

export const useSoundSyncState = () => useContext(soundSyncContext).state.soundsyncState;

const audioSourceSinkGetter = (collection, withHidden) => {
  const orderedCollection = sortBy(collection, ({ name }) => (isHidden(name) ? 10 : 0));
  if (!withHidden) {
    return orderedCollection.filter(({ name }) => !isHidden(name));
  }
  return orderedCollection;
};

export const useSinks = ({ withHidden = true } = {}) => audioSourceSinkGetter(useSoundSyncState().sinks, withHidden);
export const useSources = ({ withHidden = true } = {}) => audioSourceSinkGetter(useSoundSyncState().sources, withHidden);
export const usePipes = () => useSoundSyncState().pipes || [];
export const useIsPiped = (uuid) => some(usePipes(), (p) => p.sinkUuid === uuid || p.sourceUuid === uuid);

export const usePeer = (uuid) => find(useSoundSyncState().peers, { uuid });

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

export const useAudioStreamEditAction = () => {
  const { refreshData } = useContext(soundSyncContext);

  const { put } = useFetch();

  return useCallback(async (type, id, body) => {
    await put(`/${type}/${id}`, body);
    refreshData();
  }, []);
};

export const useShowHidden = () => useContext(soundSyncContext).state.showHidden;
export const useSetHiddenVisibility = () => {
  const { dispatch } = useContext(soundSyncContext);
  return (...args) => dispatch(changeHiddenVisibility(...args));
};
