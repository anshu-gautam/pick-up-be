import { Router } from 'express';
import generateRoutes from './generate.routes';
import gradientRoutes from './gradient.routes';
import accessibilityRoutes from './accessibility.routes';
import exportRoutes from './export.routes';
import userRoutes from './user.routes';
import analyticsRoutes from './analytics.routes';
import conversationRoutes from './conversation.routes';
import imageGenerationRoutes from './image-generation.routes';

const router = Router();

router.use('/generate', generateRoutes);
router.use('/gradients', gradientRoutes);
router.use('/conversations', conversationRoutes);
router.use('/validate/accessibility', accessibilityRoutes);
router.use('/export', exportRoutes);
router.use('/users', userRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/images', imageGenerationRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
