import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// Parse Redis URL to determine if TLS is needed
const isHerokuRedis = env.REDIS_URL.includes('rediss://') || env.REDIS_URL.includes('heroku');

// Configure Redis with TLS for Heroku Redis
const redisOptions: any = {
  password: env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Add TLS configuration for Heroku Redis (rediss:// or heroku URLs)
if (isHerokuRedis) {
  redisOptions.tls = {
    rejectUnauthorized: false, // Heroku Redis uses self-signed certificates
  };
}

export const redis = new Redis(env.REDIS_URL, redisOptions);

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
