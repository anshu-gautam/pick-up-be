import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// Get Redis URL - check for Heroku Redis URL first
const getRedisUrl = (): string => {
  // On Heroku, Redis addon sets REDIS_URL automatically
  // Also check for REDIS_TLS_URL (used by some Heroku Redis plans)
  let redisUrl = process.env.REDIS_TLS_URL || process.env.REDIS_URL || env.REDIS_URL;
  
  // Fix Upstash Redis URLs that might be missing protocol
  if (redisUrl && redisUrl.startsWith('//')) {
    // Upstash URLs sometimes come without protocol, add rediss://
    redisUrl = `rediss:${redisUrl}`;
    logger.info('Fixed Upstash Redis URL (added protocol)');
  }
  
  // Ensure URL has proper protocol
  if (redisUrl && !redisUrl.match(/^(redis|rediss):\/\//)) {
    // If no protocol, assume rediss:// for external services
    redisUrl = `rediss://${redisUrl}`;
    logger.info('Added rediss:// protocol to Redis URL');
  }
  
  // Log the URL being used (masked for security)
  const maskedUrl = redisUrl.replace(/:[^:@]+@/, ':****@');
  logger.info(`Connecting to Redis: ${maskedUrl}`);
  
  return redisUrl;
};

const redisUrl = getRedisUrl();

// Parse Redis URL to determine if TLS is needed
const isHerokuRedis = redisUrl.includes('rediss://') || 
                       redisUrl.includes('heroku') || 
                       redisUrl.includes('redis.heroku') ||
                       redisUrl.includes('upstash.io') || // Upstash Redis requires TLS
                       process.env.REDIS_TLS_URL !== undefined;

// Configure Redis with TLS for Heroku Redis
const redisOptions: any = {
  password: env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: false,
};

// Add TLS configuration for Heroku Redis (rediss:// or heroku URLs)
if (isHerokuRedis) {
  redisOptions.tls = {
    rejectUnauthorized: false, // Heroku Redis uses self-signed certificates
  };
  logger.info('Using TLS for Redis connection (Heroku Redis detected)');
}

export const redis = new Redis(redisUrl, redisOptions);

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
