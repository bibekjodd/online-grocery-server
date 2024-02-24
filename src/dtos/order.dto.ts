import z from 'zod';

export const placeOrderSchema = z.object({
  address: z.string().trim(),
  paymentType: z.enum(['cash-on-delivery', 'online']),
  quantity: z
    .number()
    .positive()
    .max(10_000, "Can't order more than 10,000 products at once")
});

export const updateOrderSchema = z
  .object({
    paid: z.boolean().optional(),
    delivered: z.boolean().optional()
  })
  .refine((value) => {
    if (Object.keys(value).length === 0) return false;
    return true;
  }, 'No any data on request');

export const getOrdersSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((value) => {
      const limit = Number(value) || 10;
      if (limit < 1 || limit > 10) return 10;
      return limit;
    }),
  cursor: z
    .string()
    .datetime()
    .optional()
    .transform((value) => value || new Date().toISOString())
});
export const getOrdersOnMyProductsSchema = getOrdersSchema;
