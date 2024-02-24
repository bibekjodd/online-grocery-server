import z from 'zod';

export const postReviewSchema = z
  .object({
    title: z.string().trim().max(100, 'Too long review title'),
    text: z.string().trim().max(500, 'Too long review').optional(),
    rating: z.number().min(1).max(5)
  })
  .partial();

export const queryReviewsSchema = z.object({
  cursor: z
    .string()
    .datetime({ offset: true })
    .optional()
    .transform((value) => value || new Date().toISOString()),
  limit: z
    .string()
    .optional()
    .transform((value) => {
      const limit = Number(value) || 10;
      if (limit < 1 || limit > 10) return 10;
      return limit;
    })
});
