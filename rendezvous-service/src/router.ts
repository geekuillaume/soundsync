import { createServer } from 'http';
import { createServer as createServerHttps } from 'https';
import config from 'config';
import Koa from 'koa';
import logger from 'koa-logger';
import bodyParser from 'koa-bodyparser';
import koaStatic from 'koa-static';
import send from 'koa-send';

import { resolve } from 'path';
import { readFileSync } from 'fs';
import internalAddressRouter from './routes/internalAddress';
import wrtcMessengerRouter from './routes/wrtc_messenger';
import downloadRouter from './routes/download';

export const initHttpServer = () => {
  const app = new Koa();
  const server = createServer(app.callback());

  if ((config.get('debug'))) { // casting to boolean to allow setting the env variable APP_DEBUG=false which will treat false as a string which is truthy
    app.use(logger());
  }

  app.proxy = true;

  if (!config.get('proxyTarget')) {
    const staticWebuiPath = resolve(__dirname, '../../webui/dist');
    app.use(koaStatic(staticWebuiPath, {
      maxage: 365 * 24 * 1000 * 60 * 60, // 365 days cache
    }));
    app.use(async (ctx, next) => {
      await next();
      if (ctx.status === 404) {
        await send(ctx, `index.html`, { root: staticWebuiPath });
      }
    });
  }

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
  app.use(downloadRouter.allowedMethods())
    .use(downloadRouter.routes());

  if (config.get('proxyTarget')) {
    // eslint-disable-next-line
    const proxy = require('koa-proxies'); // requiring it here to only load it when necessary and push koa-proxies in devDependencies

    // used for dev work when working on the backoffice with create-react-app
    console.log('Setting proxy to', config.get('proxyTarget'));
    app.use(proxy('/', {
      target: config.get('proxyTarget'),
    }));
    server.on('upgrade', (req, res) => { // used for websockets proxy as create-react-app use WS to reload the page when necessary
      // @ts-ignore
      proxy.proxy.ws(req, res, { changeOrigin: true, target: config.get('proxyTarget') });
    });
  }

  server.listen(config.get('port'));
  console.log(`Server listening on ${config.get('port')}`);

  if (config.get('httpsPort')) {
    createServerHttps({
      key: readFileSync(resolve(__dirname, '../domain.key')),
      cert: readFileSync(resolve(__dirname, '../domain.crt')),
    }, app.callback()).listen(config.get('httpsPort'));
    console.log(`HTTPS Server listening on ${config.get('httpsPort')}`);
  }

  return app;
};
