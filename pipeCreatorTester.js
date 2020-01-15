const superagent = require('superagent');
const _ = require('lodash');

const main = async () => {
  const {body} = await superagent.get(`localhost:8080/state`);

  const possiblePipes = body.sources.flatMap((source) => body.sinks.map((sink) => ({source: source.uuid, sink: sink.uuid})))

  for (const possiblePipe of possiblePipes) {
    const existingPipe = _.find(body.pipes, {
      sinkUuid: possiblePipe.sink,
      sourceUuid: possiblePipe.source,
    });

    if (!existingPipe) {
      await superagent.post(`localhost:8080/source/${possiblePipe.source}/pipe_to_sink/${possiblePipe.sink}`);
    }
  }

}
main();
