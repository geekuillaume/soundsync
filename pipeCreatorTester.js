const superagent = require('superagent');

const main = async () => {
  const {body} = await superagent.get(`localhost:8080/state`);
  const sourceUuid = body.sources[0].uuid;
  const sinkUuid = body.sinks[0].uuid;
  await superagent.post(`localhost:8080/source/${sourceUuid}/pipe_to_sink/${sinkUuid}`);
}
main();
