import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { optionalAuth } from '../middleware/auth.middleware';
import { generousRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/track', generousRateLimiter, optionalAuth, AnalyticsController.track);

router.get('/trending', generousRateLimiter, AnalyticsController.getTrending);

router.get('/popular', generousRateLimiter, AnalyticsController.getPopular);

export default router;
