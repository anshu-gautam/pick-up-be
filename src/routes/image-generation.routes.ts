import { Router } from 'express';
import { ImageGenerationController } from '../controllers/image-generation.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator.middleware';
import {
  generateHeroImageSchema,
  generateHeroImageVariationsSchema,
  generateImageWithTextSchema,
  editImageSchema,
  getUserImagesSchema,
  imageIdParamSchema,
} from '../validators/image-generation.validator';
import { strictRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * @route GET /api/images
 * @desc Get user's generated images (paginated)
 * @access Private
 */
router.get(
  '/',
  authenticate,
  validate(getUserImagesSchema as any),
  ImageGenerationController.getUserImages
);

/**
 * @route GET /api/images/:id
 * @desc Get a specific generated image by ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  validate(imageIdParamSchema as any),
  ImageGenerationController.getImageById
);

/**
 * @route DELETE /api/images/:id
 * @desc Delete a generated image
 * @access Private
 */
router.delete(
  '/:id',
  authenticate,
  validate(imageIdParamSchema as any),
  ImageGenerationController.deleteImage
);

/**
 * @route POST /api/images/generate
 * @desc Generate a single hero section image using Gemini AI
 * @access Private
 */
router.post(
  '/generate',
  strictRateLimiter,
  authenticate,
  validate(generateHeroImageSchema),
  ImageGenerationController.generateHeroImage
);

/**
 * @route POST /api/images/generate/variations
 * @desc Generate multiple hero image variations
 * @access Private
 */
router.post(
  '/generate/variations',
  strictRateLimiter,
  authenticate,
  validate(generateHeroImageVariationsSchema),
  ImageGenerationController.generateHeroImageVariations
);

/**
 * @route POST /api/images/generate/with-text
 * @desc Generate an image with text overlay (for ads, social posts)
 * @access Private
 */
router.post(
  '/generate/with-text',
  strictRateLimiter,
  authenticate,
  validate(generateImageWithTextSchema),
  ImageGenerationController.generateImageWithText
);

/**
 * @route POST /api/images/edit
 * @desc Edit an existing image using Gemini AI
 * @access Private
 */
router.post(
  '/edit',
  strictRateLimiter,
  authenticate,
  validate(editImageSchema),
  ImageGenerationController.editImage
);

/**
 * @route GET /api/images/styles
 * @desc Get available hero image styles
 * @access Private
 */
router.get(
  '/styles',
  authenticate,
  ImageGenerationController.getAvailableStyles
);

export default router;
