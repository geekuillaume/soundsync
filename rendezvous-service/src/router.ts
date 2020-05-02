import { createServer } from 'http';
import config from 'config';
import Koa from 'koa';
import logger from 'koa-logger';
import bodyParser from 'koa-bodyparser';

import internalAddressRouter from './routes/internalAddress';
import wrtcMessengerRouter from './routes/wrtc_messenger';

export const initHttpServer = () => {
  const app = new Koa();
  const server = createServer(app.callback());

  if ((config.get('debug'))) { // casting to boolean to allow setting the env variable APP_DEBUG=false which will treat false as a string which is truthy
    app.use(logger());
  }

  // app.proxy = true;

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      if (!err.status || err.status >= 500) {
        console.error(err);
      }
      err.status = err.statusCode || err.status || 500;
      throw err;
    }
  });

  app.use(bodyParser({
    enableTypes: ['json', 'text'],
  }));

  app.use(internalAddressRouter.allowedMethods())
    .use(internalAddressRouter.routes());
  app.use(wrtcMessengerRouter.allowedMethods())
    .use(wrtcMessengerRouter.routes());

  server.listen(config.get('port'));
  console.log(`Server listening on ${config.get('port')}`);
  return app;
};
