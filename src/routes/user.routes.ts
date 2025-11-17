import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { defaultRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.get('/profile', defaultRateLimiter, authenticate, UserController.getProfile);

router.put('/profile', defaultRateLimiter, authenticate, UserController.updateProfile);

router.get('/stats', defaultRateLimiter, authenticate, UserController.getStats);

export default router;
