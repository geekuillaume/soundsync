import React, { useCallback } from 'react';
import { useEffect, createContext, useReducer, useContext, useState } from 'react';
import useFetch from 'use-http';
import {find, some} from 'lodash-es';
import { createAction, handleActions } from 'redux-actions';
import produce from 'immer';

const initialState = {soundsyncState: {}, registeringForPipe: {type: null, uuid: null}};

const soundSyncContext = createContext({state: initialState, dispatch: (...args) => {}, refreshData: () => {}});

const stateUpdate = createAction('stateUpdate');
const registerForPipe = createAction('registerForPipe');
const unregisterForPipe = createAction('unregisterForPipe');

export const SoundSyncProvider = ({children}) => {
  const { get } = useFetch({
    path: '/state'
  });

  const [state, dispatch] = useReducer(handleActions({
    [stateUpdate.toString()]: produce((state, {payload}) => {
      state.soundsyncState = payload;
    }),
    [registerForPipe.toString()]: produce((state, {payload}) => {
      state.registeringForPipe.type = payload.type;
      state.registeringForPipe.uuid = payload.uuid;
    }),
    [unregisterForPipe.toString()]: produce((state) => {
      state.registeringForPipe = {};
    })
  }, initialState), initialState);

  const refreshData = useCallback(async () => {
    const res = await get();
    dispatch(stateUpdate(res));
  }, []);

  useEffect(() => {
    refreshData();
    const id = setInterval(refreshData, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <soundSyncContext.Provider value={{state, dispatch, refreshData}}>
      {children}
    </soundSyncContext.Provider>
  );
}

export const useSoundSyncState = () => useContext(soundSyncContext).state.soundsyncState;

export const useSinks = () => useSoundSyncState().sinks;
export const useSources = () => useSoundSyncState().sources;
export const usePipes = () => useSoundSyncState().pipes;
export const useIsSinkPiped = (uuid) => some(usePipes(), {sinkUuid: uuid})

export const usePeer = (uuid) => find(useSoundSyncState().peers, {uuid});

export const useRegisterForPipe = (type, uuid) => {
  const {post} = useFetch();

  const {state, dispatch, refreshData} = useContext(soundSyncContext)
  const isSelectedElement = state.registeringForPipe.uuid === uuid;
  const shouldShow = state.registeringForPipe.type !== type || isSelectedElement;

  useEffect(() => {
    const clickListener = (e) => {
      if (!e.target.closest('.source-container,.sink-container')) {
        dispatch(unregisterForPipe());
      }
    }
    if (state.registeringForPipe.uuid === uuid) {
      document.addEventListener('click', clickListener);
    }
    return () => {
      document.removeEventListener('click', clickListener);
    }
  }, [state.registeringForPipe.uuid === uuid])

  return [shouldShow, isSelectedElement, async () => {
    if (state.registeringForPipe.type && state.registeringForPipe.type !== type) {
      const sourceUuid = type === 'source' ? uuid : state.registeringForPipe.uuid;
      const sinkUuid = type === 'sink' ? uuid : state.registeringForPipe.uuid;
      dispatch(unregisterForPipe());
      await post(`/source/${sourceUuid}/pipe_to_sink/${sinkUuid}`);
      refreshData();
    } else {
      dispatch(registerForPipe({type, uuid}));
    }
  }];
}

export const useUnpipeAction = (sinkUuid) => {
  const {dispatch, refreshData} = useContext(soundSyncContext)

  const {del} = useFetch();
  const pipe = find(usePipes(), {sinkUuid});

  return useCallback(async () => {
    if (!pipe) {
      return;
    }
    dispatch(unregisterForPipe());
    await del(`/source/${pipe.sourceUuid}/pipe_to_sink/${pipe.sinkUuid}`);
    refreshData();
  }, [pipe]);
}
