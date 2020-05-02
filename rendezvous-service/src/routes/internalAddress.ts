import config from 'config';
import Router from 'koa-router';
import { DefaultState, Context } from 'koa';
import { redis } from '../lib/redis';
// import cors from '@koa/cors';

const SECONDS_IN_DAY = 24 * 60 * 60;
const getDayTimestamp = () => Math.floor(new Date().getTime() / 1000 / SECONDS_IN_DAY);

const router = new Router<DefaultState, Context>();

// const allowedOrigins = ['https://twitch.com'];
// router.use(cors({
//   origin: (ctx) => {
//     if (allowedOrigins.includes(ctx.origin)) {
//       return ctx.origin;
//     }
//     return null;
//   }
// }))

router.post(`/api/ip_registry/register`, async (ctx) => {
  ctx.assert(typeof ctx.request.body === 'string', 400, 'body should be a string');
  ctx.assert(ctx.request.body.length < 256, 400, 'body length should be less than 256 chars');
  const internalIps = ctx.request.body.split(',');
  const externalIp = ctx.request.ip;

  // we add the ip to two sets, one for the current day and one for the next day and set the expire time accordingly
  // this is used to delete unused internal ip after 24h using only the expire strategy of redis

  const pipeline = redis.pipeline();
  internalIps.forEach((ip) => {
    pipeline.sadd(`ip_registry:${getDayTimestamp()}:${externalIp}`, ip);
    pipeline.sadd(`ip_registry:${getDayTimestamp() + 1}:${externalIp}`, ip);
  });
  pipeline.expire(`ip_registry:${getDayTimestamp()}:${externalIp}`, config.get('ipAddressRegistryExpireTime'));
  pipeline.expire(`ip_registry:${getDayTimestamp() + 1}:${externalIp}`, SECONDS_IN_DAY);
  await pipeline.exec();

  ctx.status = 204;
});

router.get('/api/ip_registry/peers', async (ctx) => {
  const externalIp = ctx.request.ip;
  const ips = await redis.smembers(`ip_registry:${getDayTimestamp()}:${externalIp}`);
  ctx.body = ips;
});

export default router;
