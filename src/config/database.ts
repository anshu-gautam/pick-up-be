import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import { logger } from './logger';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const initializeDatabase = async () => {
  try {
    const { error } = await supabase.from('gradients').select('count').limit(1);
    if (error && error.code === '42P01') {
      logger.info('Database tables not found. Please run migrations.');
    } else {
      logger.info('Database connection established successfully');
    }
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};
