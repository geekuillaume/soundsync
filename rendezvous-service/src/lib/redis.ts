import Redis from 'ioredis';
import config from 'config';

export const createRedisClient = () => {
  if (config.get('redis.url')) {
    return new Redis(String(config.get('redis.url')));
  }
  return new Redis({
    host: config.get('redis.host') as string,
    port: config.get('redis.port') as number,
  });
};

export const redis = createRedisClient();

export const testRedisConnection = async () => {
  await redis.echo('1');
};
