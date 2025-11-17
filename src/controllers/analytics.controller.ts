import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AnalyticsModel } from '../models/analytics.model';
import { logger } from '../config/logger';

export class AnalyticsController {
  static async track(req: AuthRequest, res: Response) {
    try {
      const { eventType, gradientId, metadata } = req.body;
      const userId = req.userId;

      await AnalyticsModel.trackEvent({
        eventType,
        gradientId,
        userId,
        metadata,
        timestamp: new Date(),
      });

      logger.info(`Tracked analytics event: ${eventType}`);

      res.status(201).json({ success: true });
    } catch (error) {
      logger.error('Error tracking analytics:', error);
      throw error;
    }
  }

  static async getTrending(req: AuthRequest, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const trending = await AnalyticsModel.getTrendingGradients(limit);
      logger.info(`Retrieved ${trending.length} trending gradients`);

      res.json(trending);
    } catch (error) {
      logger.error('Error getting trending gradients:', error);
      throw error;
    }
  }

  static async getPopular(req: AuthRequest, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const popular = await AnalyticsModel.getPopularGradients(limit);
      logger.info(`Retrieved ${popular.length} popular gradients`);

      res.json(popular);
    } catch (error) {
      logger.error('Error getting popular gradients:', error);
      throw error;
    }
  }
}
