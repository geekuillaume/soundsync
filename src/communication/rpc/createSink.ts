import { Peer } from '../peer';
import { SinkDescriptor } from '../../audio/sinks/sink_type';
import { getAudioSourcesSinksManager } from '../../audio/get_audio_sources_sinks_manager';

export const onCreateSink = async (peer: Peer, descriptor: SinkDescriptor) => {
  getAudioSourcesSinksManager().addSink(descriptor);
};
