import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure DATABASE_URL has SSL parameters for Supabase
const ensureDatabaseUrl = (): string => {
  const dbUrl = process.env.DATABASE_URL || '';
  
  if (!dbUrl.includes('supabase.co')) {
    return dbUrl;
  }
  
  // Parse the URL
  try {
    const url = new URL(dbUrl);
    const params = new URLSearchParams(url.search);
    
    // Add SSL parameters if not present
    if (!params.has('sslmode')) {
      params.set('sslmode', 'require');
    }
    
    // Add connection parameters for better reliability
    if (!params.has('connect_timeout')) {
      params.set('connect_timeout', '10');
    }
    
    // Reconstruct URL with parameters
    url.search = params.toString();
    return url.toString();
  } catch (error) {
    // If URL parsing fails, try simple string manipulation
    if (!dbUrl.includes('sslmode=')) {
      const separator = dbUrl.includes('?') ? '&' : '?';
      return `${dbUrl}${separator}sslmode=require&connect_timeout=10`;
    }
    return dbUrl;
  }
};

// Override DATABASE_URL if needed (must happen before PrismaClient instantiation)
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.co')) {
  const updatedUrl = ensureDatabaseUrl();
  if (updatedUrl !== process.env.DATABASE_URL) {
    process.env.DATABASE_URL = updatedUrl;
    logger.info('Updated DATABASE_URL with SSL parameters for Supabase');
  }
}

// Also ensure DIRECT_URL has SSL if it's a Supabase URL
if (process.env.DIRECT_URL && process.env.DIRECT_URL.includes('supabase.co')) {
  const directUrl = ensureDatabaseUrl();
  if (directUrl !== process.env.DIRECT_URL) {
    process.env.DIRECT_URL = directUrl;
    logger.info('Updated DIRECT_URL with SSL parameters for Supabase');
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
    // Log connection attempt (without sensitive data)
    const dbUrl = process.env.DATABASE_URL || '';
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@'); // Mask password
    logger.info(`Attempting to connect to database: ${maskedUrl}`);
    
    await prisma.$connect();
    logger.info('Database connected successfully via Prisma');
  } catch (error: any) {
    logger.error('Failed to connect to database:', error);
    
    // Provide helpful error message for Supabase
    if (error?.message?.includes("Can't reach database server")) {
      const dbUrl = process.env.DATABASE_URL || '';
      if (dbUrl.includes('supabase.co')) {
        logger.error('Supabase connection troubleshooting:');
        logger.error('1. Ensure DATABASE_URL includes ?sslmode=require');
        logger.error('2. Check if your Supabase project allows connections from Heroku IPs');
        logger.error('3. Verify the database password is correct');
        logger.error('4. Consider using connection pooling URL (port 6543) instead of direct (port 5432)');
      }
    }
    
    throw error;
  }
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  logger.info('Database disconnected');
};
