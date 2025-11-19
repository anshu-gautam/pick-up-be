import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ImageGenerationService } from '../services/image-generation.service';
import { UserModel } from '../models/user.model';
import { AnalyticsModel } from '../models/analytics.model';
import { logger } from '../config/logger';
import { AppError } from '../middleware/errorHandler.middleware';

export class ImageGenerationController {
  /**
   * Generate a single hero section image
   * POST /api/images/generate
   */
  static async generateHeroImage(req: AuthRequest, res: Response) {
    try {
      const { prompt, style, includeText, mood, colorScheme } = req.body;
      const userId = req.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Check user generation limits
      const stats = await UserModel.getStats(userId);
      if (stats.generationsUsed >= stats.generationsLimit) {
        throw new AppError('Generation limit reached', 429);
      }

      logger.info(`Generating hero image for user ${userId} with prompt: "${prompt}"`);

      const image = await ImageGenerationService.generateHeroImage(
        {
          prompt,
          style,
          includeText,
          mood,
          colorScheme,
        },
        userId
      );

      // Track analytics
      await AnalyticsModel.trackEvent({
        eventType: 'generation',
        userId,
        metadata: {
          type: 'hero-image',
          prompt,
          style: image.style,
        },
        timestamp: new Date(),
      });

      res.json({
        image,
        metadata: {
          generatedAt: image.generatedAt,
          style: image.style,
        },
      });
    } catch (error) {
      logger.error('Error in generateHeroImage controller:', error);
      throw error;
    }
  }

  /**
   * Generate multiple hero image variations
   * POST /api/images/generate/variations
   */
  static async generateHeroImageVariations(req: AuthRequest, res: Response) {
    try {
      const { prompt, style, includeText, mood, colorScheme, count = 3 } = req.body;
      const userId = req.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Check user generation limits
      const stats = await UserModel.getStats(userId);
      if (stats.generationsUsed >= stats.generationsLimit) {
        throw new AppError('Generation limit reached', 429);
      }

      logger.info(`Generating ${count} hero image variations for user ${userId}`);

      const images = await ImageGenerationService.generateHeroImageVariations(
        {
          prompt,
          style,
          includeText,
          mood,
          colorScheme,
        },
        userId,
        count
      );

      // Track analytics
      await AnalyticsModel.trackEvent({
        eventType: 'generation',
        userId,
        metadata: {
          type: 'hero-image-variations',
          prompt,
          count: images.length,
        },
        timestamp: new Date(),
      });

      res.json({
        images,
        metadata: {
          generatedAt: new Date(),
          count: images.length,
        },
      });
    } catch (error) {
      logger.error('Error in generateHeroImageVariations controller:', error);
      throw error;
    }
  }

  /**
   * Generate image with text overlay
   * POST /api/images/generate/with-text
   */
  static async generateImageWithText(req: AuthRequest, res: Response) {
    try {
      const { prompt, text, style = 'minimal' } = req.body;
      const userId = req.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Check user generation limits
      const stats = await UserModel.getStats(userId);
      if (stats.generationsUsed >= stats.generationsLimit) {
        throw new AppError('Generation limit reached', 429);
      }

      logger.info(`Generating image with text for user ${userId}`);

      const image = await ImageGenerationService.generateImageWithText(
        prompt,
        text,
        userId,
        style
      );

      // Track analytics
      await AnalyticsModel.trackEvent({
        eventType: 'generation',
        userId,
        metadata: {
          type: 'image-with-text',
          prompt,
          text,
          style,
        },
        timestamp: new Date(),
      });

      res.json({
        image,
        metadata: {
          generatedAt: image.generatedAt,
          style: image.style,
        },
      });
    } catch (error) {
      logger.error('Error in generateImageWithText controller:', error);
      throw error;
    }
  }

  /**
   * Edit an existing image
   * POST /api/images/edit
   */
  static async editImage(req: AuthRequest, res: Response) {
    try {
      const { imageUrl, editPrompt } = req.body;
      const userId = req.userId;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Check user generation limits
      const stats = await UserModel.getStats(userId);
      if (stats.generationsUsed >= stats.generationsLimit) {
        throw new AppError('Generation limit reached', 429);
      }

      logger.info(`Editing image for user ${userId}`);

      const image = await ImageGenerationService.editImage(imageUrl, editPrompt, userId);

      // Track analytics
      await AnalyticsModel.trackEvent({
        eventType: 'generation',
        userId,
        metadata: {
          type: 'image-edit',
          editPrompt,
        },
        timestamp: new Date(),
      });

      res.json({
        image,
        metadata: {
          generatedAt: image.generatedAt,
          editPrompt,
        },
      });
    } catch (error) {
      logger.error('Error in editImage controller:', error);
      throw error;
    }
  }

  /**
   * Get available hero image styles
   * GET /api/images/styles
   */
  static async getAvailableStyles(_req: AuthRequest, res: Response) {
    try {
      const styles = ImageGenerationService.getAvailableStyles();

      res.json({
        styles,
        total: styles.length,
      });
    } catch (error) {
      logger.error('Error in getAvailableStyles controller:', error);
      throw error;
    }
  }
}
