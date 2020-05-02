import cluster from 'cluster';
import { cpus } from 'os';
import config from 'config';

import { initHttpServer } from './router';
import { testRedisConnection } from './lib/redis';

const main = async () => {
  try {
    await testRedisConnection();
    initHttpServer();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

if (config.get('enableCluster')) {
  if (cluster.isMaster) {
    const workerCount = cpus().length;
    for (let i = 0; i < workerCount; i++) {
      cluster.fork();
    }

    cluster.on('exit', (worker) => {
      console.log(`worker ${worker.process.pid} died`);
    });
  } else {
    main();
  }
} else {
  main();
}
