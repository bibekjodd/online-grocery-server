import {
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const reviews = pgTable(
  'reviews',
  {
    userId: text('user_id').notNull(),
    reviewerId: text('reviewer_id').notNull(),
    title: varchar('title', { length: 100 }).notNull(),
    text: varchar('text', { length: 500 }),
    rating: integer('rating').notNull(),
    isEdited: boolean('is_edited').notNull().default(false),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow()
  },
  function constraints(reviews) {
    return {
      primarKey: primaryKey({
        name: 'reviews_pkey',
        columns: [reviews.userId, reviews.reviewerId]
      }),
      userReference: foreignKey({
        name: 'fk_user_id',
        columns: [reviews.userId],
        foreignColumns: [users.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      reviewerReference: foreignKey({
        name: 'fk_reviewer_id',
        columns: [reviews.reviewerId],
        foreignColumns: [users.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),

      userIndex: index('reviews_idx_user_id').on(reviews.userId)
    };
  }
);

export const selectReviewsSnapshot = {
  userId: reviews.userId,
  reviewerId: reviews.reviewerId,
  title: reviews.title,
  text: reviews.text,
  rating: reviews.rating,
  isEdited: reviews.isEdited,
  createdAt: reviews.createdAt
};
