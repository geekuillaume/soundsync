import { Peer } from '../peer';
import { getAudioSourcesSinksManager } from '../../audio/get_audio_sources_sinks_manager';

export const onDeleteSink = async (_peer: Peer, sinkUuid: string) => {
  getAudioSourcesSinksManager().removeSink(sinkUuid);
};
