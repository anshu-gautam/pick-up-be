import { z } from 'zod';
import { colorStopSchema } from './gradient.validator';

export const validateAccessibilitySchema = z.object({
  body: z.object({
    gradient: z.object({
      type: z.enum(['linear', 'radial', 'conic']),
      angle: z.number().min(0).max(360).optional(),
      colorStops: z.array(colorStopSchema).min(2),
    }),
    foregroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
    fontSize: z.number().min(8).max(72).optional(),
    fontWeight: z.enum(['normal', 'bold']).optional(),
  }),
});
