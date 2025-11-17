import { Router } from 'express';
import { GradientController } from '../controllers/gradient.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator.middleware';
import {
  createGradientSchema,
  updateGradientSchema,
  getGradientSchema,
  deleteGradientSchema,
  paginationSchema,
} from '../validators/gradient.validator';
import { defaultRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.get(
  '/',
  defaultRateLimiter,
  authenticate,
  validate(paginationSchema),
  GradientController.getGradients
);

router.get(
  '/public',
  defaultRateLimiter,
  optionalAuth,
  validate(paginationSchema),
  GradientController.getPublicGradients
);

router.get(
  '/:id',
  defaultRateLimiter,
  optionalAuth,
  validate(getGradientSchema),
  GradientController.getGradient
);

router.post(
  '/',
  defaultRateLimiter,
  authenticate,
  validate(createGradientSchema),
  GradientController.createGradient
);

router.put(
  '/:id',
  defaultRateLimiter,
  authenticate,
  validate(updateGradientSchema),
  GradientController.updateGradient
);

router.delete(
  '/:id',
  defaultRateLimiter,
  authenticate,
  validate(deleteGradientSchema),
  GradientController.deleteGradient
);

export default router;
