import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_STORAGE_BUCKET: string;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  JWT_SECRET: string;
  OPENAI_API_KEY: string;
  AI_MODEL: string;
  REDIS_URL: string;
  REDIS_PASSWORD?: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  CORS_ORIGIN: string;
  LOG_LEVEL: string;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const env: EnvConfig = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: parseInt(getEnv('PORT', '3000'), 10),
  SUPABASE_URL: getEnv('SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnv('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_STORAGE_BUCKET: getEnv('SUPABASE_STORAGE_BUCKET', 'gradients'),
  CLERK_SECRET_KEY: getEnv('CLERK_SECRET_KEY'),
  CLERK_PUBLISHABLE_KEY: getEnv('CLERK_PUBLISHABLE_KEY'),
  JWT_SECRET: getEnv('JWT_SECRET'),
  OPENAI_API_KEY: getEnv('OPENAI_API_KEY'),
  AI_MODEL: getEnv('AI_MODEL', 'gpt-4-turbo-preview'),
  REDIS_URL: getEnv('REDIS_URL', 'redis://localhost:6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  RATE_LIMIT_WINDOW_MS: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(getEnv('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  CORS_ORIGIN: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
  LOG_LEVEL: getEnv('LOG_LEVEL', 'info'),
};
