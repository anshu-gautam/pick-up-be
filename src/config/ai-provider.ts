import { openai, createOpenAI } from '@ai-sdk/openai';
import OpenAI from 'openai';
import { env } from './env';
import type { AIProvider } from './env';
import { logger } from './logger';

// Re-export AIProvider type for convenience
export type { AIProvider };

/**
 * AI Provider Factory
 * Handles creation of AI clients for different providers
 */

// OpenRouter configuration
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Get Vercel AI SDK model based on provider
 * Returns a LanguageModelV1 compatible model
 */
export const getVercelAIModel = (): ReturnType<typeof openai> => {
  switch (env.AI_PROVIDER) {
    case 'openai':
      return openai(env.AI_MODEL);

    case 'openrouter':
      // OpenRouter uses OpenAI-compatible API
      const openrouterProvider = createOpenAI({
        apiKey: env.OPENROUTER_API_KEY,
        baseURL: OPENROUTER_BASE_URL,
        headers: {
          'HTTP-Referer': 'https://pick-up-gradients.app', // Your app URL
          'X-Title': 'Pick Up Gradients', // Your app name
        },
      });
      return openrouterProvider(env.AI_MODEL);

    default:
      logger.warn(`Unknown AI provider: ${env.AI_PROVIDER}, falling back to OpenAI`);
      return openai('gpt-4-turbo-preview');
  }
};

/**
 * Get Direct OpenAI SDK client
 * For OpenRouter, we use OpenAI SDK with custom base URL
 */
export const getDirectOpenAIClient = (): OpenAI => {
  switch (env.AI_PROVIDER) {
    case 'openai':
      return new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });

    case 'openrouter':
      return new OpenAI({
        apiKey: env.OPENROUTER_API_KEY,
        baseURL: OPENROUTER_BASE_URL,
        defaultHeaders: {
          'HTTP-Referer': 'https://pick-up-gradients.app',
          'X-Title': 'Pick Up Gradients',
        },
      });

    default:
      return new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });
  }
};

/**
 * Check if the current provider supports JSON mode
 */
export const supportsJsonMode = (): boolean => {
  // Both OpenAI and OpenRouter support JSON mode
  return true;
};

/**
 * Get provider-specific model info
 */
export const getProviderInfo = () => {
  return {
    provider: env.AI_PROVIDER,
    model: env.AI_MODEL,
    supportsJsonMode: supportsJsonMode(),
  };
};

/**
 * Log current AI configuration
 */
export const logAIConfig = () => {
  const info = getProviderInfo();
  logger.info(`AI Provider initialized: ${info.provider}`);
  logger.info(`AI Model: ${info.model}`);
  logger.info(`JSON Mode Support: ${info.supportsJsonMode}`);
};
