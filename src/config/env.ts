import dotenv from 'dotenv';

dotenv.config();

type AIProvider = 'openai' | 'openrouter' | 'google';

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
  // AI Provider Configuration
  AI_PROVIDER: AIProvider;
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  AI_MODEL: string;
  REDIS_URL: string;
  REDIS_PASSWORD?: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  CORS_ORIGIN: string;
  LOG_LEVEL: string;
}

export type { AIProvider };

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

// Get AI provider with validation
const getAIProvider = (): AIProvider => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase() as AIProvider;
  const validProviders: AIProvider[] = ['openai', 'openrouter', 'google'];
  if (!validProviders.includes(provider)) {
    throw new Error(`Invalid AI_PROVIDER: ${provider}. Must be one of: ${validProviders.join(', ')}`);
  }
  return provider;
};

// Get default model based on provider
const getDefaultModel = (provider: AIProvider): string => {
  switch (provider) {
    case 'openai':
      return 'gpt-4-turbo-preview';
    case 'openrouter':
      return 'google/gemini-2.0-flash-exp:free'; // Default to Gemini on OpenRouter
    case 'google':
      return 'gemini-1.5-pro';
    default:
      return 'gpt-4-turbo-preview';
  }
};

const aiProvider = getAIProvider();

// Validate that required API key is present for the selected provider
const validateAIConfig = () => {
  switch (aiProvider) {
    case 'openai':
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required when AI_PROVIDER is openai');
      }
      break;
    case 'openrouter':
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY is required when AI_PROVIDER is openrouter');
      }
      break;
    case 'google':
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY is required when AI_PROVIDER is google');
      }
      break;
  }
};

validateAIConfig();

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
  // AI Provider Configuration
  AI_PROVIDER: aiProvider,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  AI_MODEL: getEnv('AI_MODEL', getDefaultModel(aiProvider)),
  REDIS_URL: getEnv('REDIS_URL', 'redis://localhost:6379'),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  RATE_LIMIT_WINDOW_MS: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(getEnv('RATE_LIMIT_MAX_REQUESTS', '100'), 10),
  CORS_ORIGIN: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
  LOG_LEVEL: getEnv('LOG_LEVEL', 'info'),
};
