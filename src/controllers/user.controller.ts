import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserModel } from '../models/user.model';
import { logger } from '../config/logger';
import { AppError } from '../middleware/errorHandler.middleware';

export class UserController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const clerkId = req.clerkId;

      if (!clerkId) {
        throw new AppError('User not authenticated', 401);
      }

      const profile = await UserModel.findByClerkId(clerkId);

      if (!profile) {
        throw new AppError('User not found', 404);
      }

      logger.info(`Retrieved profile for user ${profile.id}`);
      res.json(profile);
    } catch (error) {
      logger.error('Error getting profile:', error);
      throw error;
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const clerkId = req.clerkId;

      if (!clerkId) {
        throw new AppError('User not authenticated', 401);
      }

      const updates = {
        name: req.body.name,
        preferences: req.body.preferences,
      };

      const profile = await UserModel.updateProfile(clerkId, updates);
      logger.info(`Updated profile for user ${profile.id}`);

      res.json(profile);
    } catch (error) {
      logger.error('Error updating profile:', error);
      throw error;
    }
  }

  static async getStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const stats = await UserModel.getStats(userId);
      logger.info(`Retrieved stats for user ${userId}`);

      res.json(stats);
    } catch (error) {
      logger.error('Error getting stats:', error);
      throw error;
    }
  }
}
