import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure DATABASE_URL has SSL parameters for Supabase
const ensureDatabaseUrl = (): string => {
  const dbUrl = process.env.DATABASE_URL || '';
  
  // If it's a Supabase URL and doesn't have SSL parameters, add them
  if (dbUrl.includes('supabase.co') && !dbUrl.includes('sslmode=')) {
    const separator = dbUrl.includes('?') ? '&' : '?';
    return `${dbUrl}${separator}sslmode=require`;
  }
  
  return dbUrl;
};

// Override DATABASE_URL if needed
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.co')) {
  const updatedUrl = ensureDatabaseUrl();
  if (updatedUrl !== process.env.DATABASE_URL) {
    process.env.DATABASE_URL = updatedUrl;
    logger.info('Updated DATABASE_URL with SSL parameters for Supabase');
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Log queries in development
prisma.$on('query' as never, (e: any) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Params: ${e.params}`);
    logger.debug(`Duration: ${e.duration}ms`);
  }
});

prisma.$on('error' as never, (e: any) => {
  logger.error('Prisma error:', e);
});

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully via Prisma');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};
