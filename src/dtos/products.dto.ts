import { decodeCursor } from '@/lib/utils';
import z from 'zod';
import { imageSchema } from './common.dto';

const categorySchema = z.enum(['fruits', 'vegetables']);

export const createProductSchema = z.object({
  title: z.string().max(200, 'Too long product title').trim(),
  description: z.string().max(200, 'Too long product description').trim().optional(),
  image: imageSchema.nullish(),
  category: categorySchema,
  price: z.number().positive().max(100_000, "Can't list products with price over Rs. 100,000"),
  stock: z
    .number()
    .positive()
    .max(10_000, "Can't list products with over 10,000 stocks")
    .transform((stock) => stock || 1)
    .optional(),
  discount: z
    .number()
    .min(0)
    .max(100)
    .transform((val) => Math.round(val))
    .optional()
});

export const updateProductSchema = createProductSchema.partial().refine((values) => {
  if (Object.keys(values).length < 1) return false;
  return true;
}, 'At least one property must be specified to update product');

export const queryProductsSchema = z.object({
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
  q: z.string().trim().optional(),
  limit: z.preprocess((val) => Number(val) || undefined, z.number().min(1).max(100)).default(20),
  owner: z.string().trim().optional(),
  resource: z.enum(['self']).optional(),
  category: categorySchema.optional(),
  sort: z
    .enum(['oldest', 'recent', 'title_asc', 'title_desc', 'price_asc', 'price_desc'])
    .default('recent'),
  price_gte: z
    .string()
    .trim()
    .optional()
    .transform((value) => Number(value) || 0),
  price_lte: z
    .string()
    .trim()
    .optional()
    .transform((value) => Number(value) || 0)
});

export const checkoutProductSchema = z.object({
  products: z
    .array(
      z.object({
        id: z.string(),
        quantity: z.number().min(1).max(10_000, "Quantity can't exceed 10,000")
      })
    )
    .min(1, 'Checkout products not provided')
    .max(100, "Can't order more than 100 products at once"),
  successUrl: z.string(),
  cancelUrl: z.string()
});
