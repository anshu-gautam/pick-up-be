import { Router } from 'express';
import { GenerateController } from '../controllers/generate.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator.middleware';
import { generateGradientSchema } from '../validators/gradient.validator';
import { strictRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post(
  '/',
  strictRateLimiter,
  authenticate,
  validate(generateGradientSchema),
  GenerateController.generate
);

export default router;
