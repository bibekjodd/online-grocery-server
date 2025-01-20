import { decodeCursor } from '@/lib/utils';
import z from 'zod';

export const queryOrdersSchema = z.object({
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
  sort: z
    .enum([
      'amount_asc',
      'amount_desc',
      'ordered_at_asc',
      'ordered_at_desc',
      'delivered_at_asc',
      'delivered_at_desc'
    ])
    .default('ordered_at_desc'),
  status: z.enum(['pending', 'cancelled', 'delivered']).optional(),
  from: z
    .union([
      z
        .string()
        .date()
        .transform((val) => new Date(val).toISOString()),
      z.string().datetime()
    ])
    .optional(),
  to: z
    .union([
      z
        .string()
        .date()
        .transform((val) => {
          const to = new Date(val);
          to.setDate(to.getDate() + 1);
          return to.toISOString();
        }),
      z.string().datetime()
    ])
    .optional(),
  resource: z.enum(['customer', 'seller']).optional(),
  seller: z.string().optional(),
  customer: z.string().optional(),
  product: z.string().optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['delivered', 'cancelled'])
});
