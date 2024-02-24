import z from 'zod';
import { imageSchema } from './common.dto';

const categorySchema = z.enum(['fruits', 'vegetables']);

export const createProductSchema = z.object({
  title: z.string().max(200, 'Too long product title').trim(),
  description: z
    .array(z.string().max(200, 'Too long product description').trim())
    .max(10, "Product can't have more than 10 descriptions")
    .optional(),
  image: imageSchema.nullish(),
  category: categorySchema,
  price: z
    .number()
    .positive()
    .max(100_000, "Can't list products with price over Rs. 100,000"),
  stock: z
    .number()
    .positive()
    .max(10_000, "Can't list products with over 10,000 stocks")
    .transform((stock) => stock || 1)
    .optional(),
  discount: z
    .number()
    .positive()
    .max(100)
    .optional()
    .transform((discount) => discount || 0)
});

export const updateProductSchema = createProductSchema
  .partial()
  .refine((values) => {
    if (Object.keys(values).length < 1) return false;
    return true;
  }, 'At least one property must be specified to update product');

export const queryProductsSchema = z.object({
  q: z.string().trim().optional(),
  page: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      const page = Number(value) || 1;
      if (page < 1) return 1;
      return page;
    }),
  limit: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      const limit = Number(value) || 20;
      if (limit < 1 || limit > 20) return 20;
      return limit;
    }),
  owner: z.string().trim().optional(),
  category: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      const result = categorySchema.safeParse(value);
      if (result.success) categorySchema.parse(value);
      return undefined;
    }),
  orderby: z.string().trim().optional(),
  price_gte: z
    .string()
    .trim()
    .optional()
    .transform((value) => Number(value) || 0),
  price_lte: z
    .string()
    .trim()
    .optional()
    .transform((value) => Number(value) || 0),
  verified_seller: z
    .string()
    .trim()
    .optional()
    .transform((value) => value === 'true')
});
