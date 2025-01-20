import { decodeCursor } from '@/lib/utils';
import z from 'zod';

export const postReviewSchema = z.object({
  title: z.string().trim().max(100, 'Too long review title'),
  text: z.string().trim().max(500, 'Too long review').optional(),
  rating: z
    .number()
    .min(1)
    .max(5)
    .transform((val) => Math.round(val))
});

export const queryReviewsSchema = z.object({
  cursor: z.preprocess(
    (val) => (val ? decodeCursor(val as string) : undefined),
    z
      .object(
        {
          id: z.string(),
          value: z.preprocess((val) => String(val || ''), z.string())
        },
        { message: 'Invalid cursor' }
      )
      .optional()
  ),
  product: z.string(),
  sort: z.enum(['asc', 'desc']).default('desc'),
  rating: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z
      .number()
      .min(1)
      .max(5)
      .transform((val) => Math.round(val))
  ),
  limit: z.preprocess((val) => Number(val) || undefined, z.number().min(1).max(100)).default(20)
});
