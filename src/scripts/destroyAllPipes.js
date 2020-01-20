const superagent = require('superagent');
const _ = require('lodash');

const main = async () => {
  const {body} = await superagent.get(`localhost:6512/state`);

  for (const pipe of body.pipes) {
    console.log(`Deleting pipe between ${pipe.sourceUuid} and ${pipe.sinkUuid}`)
    await superagent.delete(`localhost:6512/source/${pipe.sourceUuid}/pipe_to_sink/${pipe.sinkUuid}`);
  }

}
main();
