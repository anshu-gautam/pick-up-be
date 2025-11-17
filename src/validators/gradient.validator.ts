import { z } from 'zod';

export const colorStopSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  position: z.number().min(0).max(100),
});

export const gradientSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['linear', 'radial', 'conic']),
  angle: z.number().min(0).max(360).optional(),
  colorStops: z.array(colorStopSchema).min(2),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
});

export const generateGradientSchema = z.object({
  body: z.object({
    prompt: z.string().min(1).max(500),
    count: z.number().min(1).max(5).optional(),
  }),
});

export const createGradientSchema = z.object({
  body: gradientSchema,
});

export const updateGradientSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: gradientSchema.partial(),
});

export const getGradientSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const deleteGradientSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});
