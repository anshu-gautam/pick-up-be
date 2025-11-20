import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure DATABASE_URL has SSL parameters for Supabase
// Also try to use connection pooling (port 6543) instead of direct (port 5432) for better reliability
const ensureDatabaseUrl = (usePooling: boolean = false): string => {
  const dbUrl = process.env.DATABASE_URL || '';
  
  if (!dbUrl.includes('supabase.co')) {
    return dbUrl;
  }
  
  let updatedUrl = dbUrl;
  
  // Try to use connection pooling (port 6543) instead of direct (port 5432)
  // Connection pooling is more reliable for production and has better connection limits
  if (usePooling && dbUrl.includes(':5432/')) {
    updatedUrl = dbUrl.replace(':5432/', ':6543/');
    logger.info('Switching to Supabase connection pooling (port 6543)');
  }
  
  // Parse the URL
  try {
    const url = new URL(updatedUrl);
    const params = new URLSearchParams(url.search);
    
    // Add SSL parameters if not present
    if (!params.has('sslmode')) {
      params.set('sslmode', 'require');
    }
    
    // Add connection parameters for better reliability
    if (!params.has('connect_timeout')) {
      params.set('connect_timeout', '10');
    }
    
    // Add connection pooling parameters if using pooling
    if (usePooling && !params.has('pgbouncer')) {
      params.set('pgbouncer', 'true');
    }
    
    // Reconstruct URL with parameters
    url.search = params.toString();
    return url.toString();
  } catch (error) {
    // If URL parsing fails, try simple string manipulation
    if (!updatedUrl.includes('sslmode=')) {
      const separator = updatedUrl.includes('?') ? '&' : '?';
      return `${updatedUrl}${separator}sslmode=require&connect_timeout=10`;
    }
    return updatedUrl;
  }
};

// Override DATABASE_URL if needed (must happen before PrismaClient instantiation)
// Use connection pooling for production (more reliable, better connection limits)
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.co')) {
  const usePooling = process.env.NODE_ENV === 'production';
  const updatedUrl = ensureDatabaseUrl(usePooling);
  if (updatedUrl !== process.env.DATABASE_URL) {
    process.env.DATABASE_URL = updatedUrl;
    logger.info(`Updated DATABASE_URL with SSL parameters${usePooling ? ' and connection pooling' : ''} for Supabase`);
  }
}

// DIRECT_URL should use direct connection (port 5432) for migrations
if (process.env.DIRECT_URL && process.env.DIRECT_URL.includes('supabase.co')) {
  const directUrl = ensureDatabaseUrl(false); // Don't use pooling for DIRECT_URL
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
