import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AccessibilityService } from '../services/accessibility.service';
import { logger } from '../config/logger';

export class AccessibilityController {
  static async validate(req: AuthRequest, res: Response) {
    try {
      const { gradient, foregroundColor, fontSize = 16, fontWeight = 'normal' } = req.body;

      logger.info(
        `Validating accessibility for gradient with foreground ${foregroundColor}`
      );

      const result = AccessibilityService.validateGradient(
        gradient,
        foregroundColor,
        fontSize,
        fontWeight
      );

      res.json(result);
    } catch (error) {
      logger.error('Error validating accessibility:', error);
      throw error;
    }
  }
}
