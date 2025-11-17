import { Router } from 'express';
import { AccessibilityController } from '../controllers/accessibility.controller';
import { optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator.middleware';
import { validateAccessibilitySchema } from '../validators/accessibility.validator';
import { defaultRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post(
  '/',
  defaultRateLimiter,
  optionalAuth,
  validate(validateAccessibilitySchema),
  AccessibilityController.validate
);

export default router;
