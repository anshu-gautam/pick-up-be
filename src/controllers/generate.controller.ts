import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AIService } from '../services/ai.service';
import { AccessibilityService } from '../services/accessibility.service';
import { UserModel } from '../models/user.model';
import { AnalyticsModel } from '../models/analytics.model';
import { logger } from '../config/logger';
import { AppError } from '../middleware/errorHandler.middleware';

export class GenerateController {
  static async generate(req: AuthRequest, res: Response) {
    try {
      const { prompt, count = 3 } = req.body;
      const userId = req.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const stats = await UserModel.getStats(userId);
      if (stats.generationsUsed >= stats.generationsLimit) {
        throw new AppError('Generation limit reached', 429);
      }

      logger.info(`Generating ${count} gradients for user ${userId} with prompt: "${prompt}"`);

      const gradients = await AIService.generateGradients(prompt, count);

      const gradientsWithScores = gradients.map((gradient) => ({
        ...gradient,
        accessibilityScore: AccessibilityService.calculateGradientScore(gradient),
      }));

      await AnalyticsModel.trackEvent({
        eventType: 'generation',
        userId,
        metadata: { prompt, count },
        timestamp: new Date(),
      });

      res.json({
        gradients: gradientsWithScores,
        metadata: {
          prompt,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error in generate controller:', error);
      throw error;
    }
  }
}
