import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';
import { env } from '../config/env';

export const createRateLimiter = (windowMs?: number, max?: number) => {
  return rateLimit({
    windowMs: windowMs || env.RATE_LIMIT_WINDOW_MS,
    max: max || env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
    message: 'Too many requests from this IP, please try again later.',
  });
};

export const strictRateLimiter = createRateLimiter(60000, 10);

export const defaultRateLimiter = createRateLimiter();

export const generousRateLimiter = createRateLimiter(900000, 200);
