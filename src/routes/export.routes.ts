import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator.middleware';
import {
  exportCSSSchema,
  exportTailwindSchema,
  exportImageSchema,
} from '../validators/export.validator';
import { defaultRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post(
  '/css',
  defaultRateLimiter,
  optionalAuth,
  validate(exportCSSSchema),
  ExportController.exportCSS
);

router.post(
  '/tailwind',
  defaultRateLimiter,
  optionalAuth,
  validate(exportTailwindSchema),
  ExportController.exportTailwind
);

router.post(
  '/image',
  defaultRateLimiter,
  optionalAuth,
  validate(exportImageSchema),
  ExportController.exportImage
);

export default router;
