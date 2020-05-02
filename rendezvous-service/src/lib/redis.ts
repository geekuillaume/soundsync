import Redis from 'ioredis';
import config from 'config';

export const createRedisClient = () => new Redis({
  host: config.get('redis.host') as string,
  port: config.get('redis.port') as number,
});

export const redis = createRedisClient();

export const testRedisConnection = async () => {
  await redis.echo('1');
};
