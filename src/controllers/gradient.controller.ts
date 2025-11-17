import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { GradientModel } from '../models/gradient.model';
import { AccessibilityService } from '../services/accessibility.service';
import { AnalyticsModel } from '../models/analytics.model';
import { logger } from '../config/logger';
import { AppError } from '../middleware/errorHandler.middleware';

export class GradientController {
  static async getGradients(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await GradientModel.findByUserId(userId, params);
      logger.info(`Retrieved ${result.data.length} gradients for user ${userId}`);

      res.json(result);
    } catch (error) {
      logger.error('Error getting gradients:', error);
      throw error;
    }
  }

  static async getGradient(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const gradient = await GradientModel.findById(id, userId);

      if (!gradient) {
        throw new AppError('Gradient not found', 404);
      }

      if (gradient.userId !== userId && !gradient.isPublic) {
        throw new AppError('Access denied', 403);
      }

      await AnalyticsModel.trackEvent({
        eventType: 'view',
        gradientId: id,
        userId,
        timestamp: new Date(),
      });

      res.json(gradient);
    } catch (error) {
      logger.error('Error getting gradient:', error);
      throw error;
    }
  }

  static async getPublicGradients(req: AuthRequest, res: Response) {
    try {
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await GradientModel.findPublic(params);
      logger.info(`Retrieved ${result.data.length} public gradients`);

      res.json(result);
    } catch (error) {
      logger.error('Error getting public gradients:', error);
      throw error;
    }
  }

  static async createGradient(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const gradientData = {
        ...req.body,
        userId,
        accessibilityScore: AccessibilityService.calculateGradientScore(req.body),
      };

      const gradient = await GradientModel.create(gradientData);

      await AnalyticsModel.trackEvent({
        eventType: 'save',
        gradientId: gradient.id,
        userId,
        timestamp: new Date(),
      });

      logger.info(`Created gradient ${gradient.id} for user ${userId}`);

      res.status(201).json(gradient);
    } catch (error) {
      logger.error('Error creating gradient:', error);
      throw error;
    }
  }

  static async updateGradient(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const updates = {
        ...req.body,
      };

      if (updates.colorStops) {
        updates.accessibilityScore = AccessibilityService.calculateGradientScore(updates as any);
      }

      const gradient = await GradientModel.update(id, userId, updates);
      logger.info(`Updated gradient ${id}`);

      res.json(gradient);
    } catch (error) {
      logger.error('Error updating gradient:', error);
      throw error;
    }
  }

  static async deleteGradient(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      await GradientModel.delete(id, userId);
      logger.info(`Deleted gradient ${id}`);

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting gradient:', error);
      throw error;
    }
  }
}
