import { getAudioSourcesSinksManager } from '../../audio/get_audio_sources_sinks_manager';
import { Peer } from '../peer';

export const onRestartSource = (peer: Peer, sourceUuid: string) => {
  const source = getAudioSourcesSinksManager().getSourceByUuid(sourceUuid);
  source.stop();
  source.startReading();
};
