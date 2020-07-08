import { Peer } from '../peer';
import { getAudioSourcesSinksManager } from '../../audio/get_audio_sources_sinks_manager';

export const onStartSource = async (peer: Peer, sourceUuid: string) => {
  getAudioSourcesSinksManager().getSourceByUuid(sourceUuid).startReading();
};
