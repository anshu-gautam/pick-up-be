import { z } from 'zod';
import { colorStopSchema } from './gradient.validator';

const baseGradientSchema = z.object({
  type: z.enum(['linear', 'radial', 'conic']),
  angle: z.number().min(0).max(360).optional(),
  colorStops: z.array(colorStopSchema).min(2),
});

export const exportCSSSchema = z.object({
  body: z.object({
    gradient: baseGradientSchema,
  }),
});

export const exportTailwindSchema = z.object({
  body: z.object({
    gradient: baseGradientSchema,
  }),
});

export const exportImageSchema = z.object({
  body: z.object({
    gradient: baseGradientSchema,
    width: z.number().min(100).max(4000),
    height: z.number().min(100).max(4000),
    format: z.enum(['png', 'svg']),
  }),
});
