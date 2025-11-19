import { z } from 'zod';

// Available hero image styles
const heroImageStyleSchema = z.enum([
  'abstract',
  'gradient-art',
  'illustration',
  'landscape',
  'product',
  'minimal',
  'geometric',
  'tech',
  'nature',
  'business',
]);

// Generate single hero image
export const generateHeroImageSchema = z.object({
  body: z.object({
    prompt: z
      .string()
      .min(1, 'Prompt is required')
      .max(1000, 'Prompt must be less than 1000 characters'),
    style: heroImageStyleSchema.optional(),
    includeText: z.string().max(200, 'Text must be less than 200 characters').optional(),
    mood: z.string().max(100, 'Mood must be less than 100 characters').optional(),
    colorScheme: z.string().max(200, 'Color scheme must be less than 200 characters').optional(),
  }),
});

// Generate multiple hero image variations
export const generateHeroImageVariationsSchema = z.object({
  body: z.object({
    prompt: z
      .string()
      .min(1, 'Prompt is required')
      .max(1000, 'Prompt must be less than 1000 characters'),
    style: heroImageStyleSchema.optional(),
    includeText: z.string().max(200, 'Text must be less than 200 characters').optional(),
    mood: z.string().max(100, 'Mood must be less than 100 characters').optional(),
    colorScheme: z.string().max(200, 'Color scheme must be less than 200 characters').optional(),
    count: z.number().min(1).max(5).optional().default(3),
  }),
});

// Generate image with text overlay
export const generateImageWithTextSchema = z.object({
  body: z.object({
    prompt: z
      .string()
      .min(1, 'Prompt is required')
      .max(1000, 'Prompt must be less than 1000 characters'),
    text: z
      .string()
      .min(1, 'Text is required')
      .max(200, 'Text must be less than 200 characters'),
    style: heroImageStyleSchema.optional().default('minimal'),
  }),
});

// Edit existing image
export const editImageSchema = z.object({
  body: z.object({
    imageUrl: z.string().url('Invalid image URL'),
    editPrompt: z
      .string()
      .min(1, 'Edit prompt is required')
      .max(500, 'Edit prompt must be less than 500 characters'),
  }),
});

// Get user images with pagination and optional style filter
export const getUserImagesSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, 'Page must be greater than 0'),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
    style: heroImageStyleSchema.optional(),
  }),
});

// Get or delete image by ID
export const imageIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid image ID format'),
  }),
});
