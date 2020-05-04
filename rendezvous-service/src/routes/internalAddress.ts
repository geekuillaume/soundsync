import config from 'config';
import Router, { url } from 'koa-router';
import { DefaultState, Context } from 'koa';
import cors from '@koa/cors';
import { redis } from '../lib/redis';

const SECONDS_IN_DAY = 24 * 60 * 60;
const getDayTimestamp = () => Math.floor(new Date().getTime() / 1000 / SECONDS_IN_DAY);

const router = new Router<DefaultState, Context>();

const allowedOriginsHostnames = ['localhost', '127.0.0.1'];
router.use(cors({
  origin: (ctx) => {
    const hostname = new URL(ctx.origin).hostname.split(':')[0];
    if (allowedOriginsHostnames.includes(hostname)) {
      return ctx.origin;
    }
    return null;
  },
}));

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
