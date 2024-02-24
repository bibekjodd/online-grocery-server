import { db } from '@/config/database';
import { postReviewSchema, queryReviewsSchema } from '@/dtos/review.dto';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException
} from '@/lib/exceptions';
import { handleAsync } from '@/middlewares/handle-async';
import { reviews, selectReviewsSnapshot } from '@/schemas/review.schema';
import { selectUserSnapshot, users } from '@/schemas/user.schema';
import { and, desc, eq, lt } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export const postReview = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const userId = req.params.id;
  const reviewerId = req.user.id;
  if (userId === reviewerId)
    throw new ForbiddenException("You can't review yourself");

  const { rating, title, text } = postReviewSchema.parse(req.body);
  await db
    .insert(reviews)
    .values({
      userId,
      reviewerId,
      title: title as unknown as string,
      rating: rating as unknown as number,
      text
    })
    .onConflictDoUpdate({
      target: [reviews.userId, reviews.reviewerId],
      set: { rating, title, text, isEdited: true }
    })
    .catch(() => {
      throw new BadRequestException('Provide required data to add review');
    });

  return res.json({ message: 'Reviewed successfully' });
});

export const getReviews = handleAsync<{ id: string }>(async (req, res) => {
  const userId = req.params.id;
  const { limit, cursor } = queryReviewsSchema.parse(req.query);
  const reviewer = alias(users, 'reviewer');

  const result = await db
    .select({
      ...selectReviewsSnapshot,
      user: selectUserSnapshot,
      reviewer: {
        id: reviewer.id,
        name: reviewer.name,
        email: reviewer.email,
        image: reviewer.image,
        isGoogleUser: reviewer.isGoogleUser,
        role: reviewer.role,
        createdAt: reviewer.createdAt,
        isVerified: reviewer.isVerified,
        state: reviewer.state,
        district: reviewer.district,
        area: reviewer.area
      }
    })
    .from(reviews)
    .where(and(eq(reviews.userId, userId), lt(reviews.createdAt, cursor)))
    .leftJoin(users, eq(reviews.userId, users.id))
    .leftJoin(reviewer, eq(reviews.reviewerId, reviewer.id))
    .groupBy(reviews.userId, reviews.reviewerId, users.id, reviewer.id)
    .orderBy(desc(reviews.createdAt))
    .limit(limit);

  return res.json({ total: result.length, reviews: result });
});

export const deleteReview = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const userId = req.params.id;
  const reviewerId = req.user.id;

  const [result] = await db
    .delete(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.reviewerId, reviewerId)))
    .returning();
  if (!result) {
    throw new BadRequestException(
      'Review already deleted or you are not allowed to allowed to delete this review'
    );
  }

  return res.json({ message: 'Review deleted successfully' });
});
