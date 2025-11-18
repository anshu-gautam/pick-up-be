import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { env } from '../config/env';
import { UserModel } from '../models/user.model';
import { logger } from '../config/logger';

export interface AuthRequest extends Request {
  userId?: string;
  clerkId?: string;
  user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const payload = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
      });

      const clerkId = payload.sub;
      if (!clerkId) {
        res.status(401).json({ error: 'Invalid token payload' });
        return;
      }

      let user = await UserModel.findByClerkId(clerkId);

      if (!user) {
        const email = (payload as any).email || 'unknown@example.com';
        const name = (payload as any).name;
        user = await UserModel.create(clerkId, email, name);
        logger.info(`Created new user from Clerk: ${clerkId}`);
      }

      req.clerkId = clerkId;
      req.userId = user.id;
      req.user = user;

      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal authentication error' });
  }
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const payload = await verifyToken(token, {
        secretKey: env.CLERK_SECRET_KEY,
      });

      const clerkId = payload.sub;
      if (clerkId) {
        const user = await UserModel.findByClerkId(clerkId);
        if (user) {
          req.clerkId = clerkId;
          req.userId = user.id;
          req.user = user;
        }
      }
    } catch (error) {
      logger.warn('Optional auth token verification failed:', error);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next();
  }
};
