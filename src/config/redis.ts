import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redis = new Redis(env.REDIS_URL, {
  password: env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

export const closeRedis = async () => {
  await redis.quit();
  logger.info('Redis connection closed');
};
