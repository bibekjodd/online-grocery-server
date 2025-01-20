import { getTableColumns } from 'drizzle-orm';
import { foreignKey, index, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { products } from './products.schema';
import { responseUserSchema, users } from './users.schema';

export const reviews = pgTable(
  'reviews',
  (t) => ({
    userId: t.text('user_id').notNull(),
    productId: t.text('product_id').notNull(),
    title: t.varchar('title', { length: 100 }).notNull(),
    text: t.varchar('text', { length: 500 }),
    rating: t.integer('rating').notNull(),
    createdAt: t
      .timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow()
  }),
  (reviews) => [
    primaryKey({
      name: 'reviews_pkey',
      columns: [reviews.productId, reviews.userId]
    }),

    foreignKey({
      name: 'fk_user_id',
      columns: [reviews.userId],
      foreignColumns: [users.id]
    })
      .onDelete('cascade')
      .onUpdate('cascade'),

    foreignKey({
      name: 'fk_product_id',
      columns: [reviews.productId],
      foreignColumns: [products.id]
    })
      .onDelete('cascade')
      .onUpdate('cascade'),

    index('idx_user_id_reviews').on(reviews.userId)
  ]
);

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

export const selectReviewSnapshot = getTableColumns(reviews);
export const selectReviewSchema = createSelectSchema(reviews);
export const responseReviewSchema = selectReviewSchema.extend({ user: responseUserSchema });
export type ResponseReview = z.infer<typeof responseReviewSchema>;
