import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ExportService } from '../services/export.service';
import { AnalyticsModel } from '../models/analytics.model';
import { logger } from '../config/logger';

export class ExportController {
  static async exportCSS(req: AuthRequest, res: Response) {
    try {
      const { gradient } = req.body;

      const css = ExportService.generateCSS(gradient);

      await AnalyticsModel.trackEvent({
        eventType: 'export',
        userId: req.userId,
        metadata: { format: 'css' },
        timestamp: new Date(),
      });

      logger.info('Exported gradient as CSS');

      res.json({ css });
    } catch (error) {
      logger.error('Error exporting CSS:', error);
      throw error;
    }
  }

  static async exportTailwind(req: AuthRequest, res: Response) {
    try {
      const { gradient } = req.body;

      const tailwind = ExportService.generateTailwind(gradient);

      await AnalyticsModel.trackEvent({
        eventType: 'export',
        userId: req.userId,
        metadata: { format: 'tailwind' },
        timestamp: new Date(),
      });

      logger.info('Exported gradient as Tailwind');

      res.json({ tailwind });
    } catch (error) {
      logger.error('Error exporting Tailwind:', error);
      throw error;
    }
  }

  static async exportImage(req: AuthRequest, res: Response) {
    try {
      const { gradient, width, height, format } = req.body;

      const image = await ExportService.generateImage(gradient, width, height, format);

      await AnalyticsModel.trackEvent({
        eventType: 'export',
        userId: req.userId,
        metadata: { format, width, height },
        timestamp: new Date(),
      });

      logger.info(`Exported gradient as ${format.toUpperCase()} image`);

      res.setHeader('Content-Type', format === 'png' ? 'image/png' : 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="gradient.${format}"`);
      res.send(image);
    } catch (error) {
      logger.error('Error exporting image:', error);
      throw error;
    }
  }
}
