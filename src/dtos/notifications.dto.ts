import { decodeCursor } from '@/lib/utils';
import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  cursor: z.preprocess(
    (val) => (val ? decodeCursor(val as string) : undefined),
    z
      .object(
        {
          id: z.string(),
          value: z.string().datetime({ message: 'Invalid cursor' })
        },
        { message: 'Invalid cursor' }
      )
      .optional()
  ),
  limit: z.preprocess((val) => Number(val) || undefined, z.number().min(1).max(100).default(20)),
  sort: z.enum(['asc', 'desc']).default('desc')
});
