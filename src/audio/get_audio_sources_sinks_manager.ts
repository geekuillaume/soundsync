import { AudioSourcesSinksManager } from './audio_sources_sinks_manager';

let audioSourcesSinksManager: AudioSourcesSinksManager = null;

export const getAudioSourcesSinksManager = () => {
  if (!audioSourcesSinksManager) {
    throw new Error('audioSourcesSinksManager not registered');
  }
  return audioSourcesSinksManager;
};

export const registerAudioSourcesSinksManager = (manager) => {
  audioSourcesSinksManager = manager;
};
