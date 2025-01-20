import { db } from '@/db';
import { products } from '@/db/products.schema';
import { ResponseReview, Review, reviews, selectReviewSnapshot } from '@/db/reviews.schema';
import { selectUserSnapshot, users } from '@/db/users.schema';
import { postReviewSchema, queryReviewsSchema } from '@/dtos/reviews.dto';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@/lib/exceptions';
import { encodeCursor } from '@/lib/utils';
import { and, asc, desc, eq, gt, lt, or, SQL } from 'drizzle-orm';
import { RequestHandler } from 'express';

export const postReview: RequestHandler<{ id: string }, { review: ResponseReview }> = async (
  req,
  res
) => {
  if (!req.user) throw new UnauthorizedException();
  const productId = req.params.id;

  const [product] = await db
    .select({ id: products.id, ownerId: products.ownerId })
    .from(products)
    .where(eq(products.id, productId));
  if (!product) throw new NotFoundException('Product does not exist');

  if (req.user.id === product.ownerId)
    throw new BadRequestException('Not allowed to review the product of self');

  const data = postReviewSchema.parse(req.body);
  const [review] = await db
    .insert(reviews)
    .values({
      ...data,
      userId: req.user.id,
      productId
    })
    .onConflictDoNothing({ target: [reviews.productId, reviews.userId] })
    .returning();

  if (!review) throw new BadRequestException('Review is already posted!');

  res.status(201).json({ review: { ...review, user: req.user } });
};

export const getReviews: RequestHandler<
  { id: string },
  { cursor: string | undefined; reviews: ResponseReview[] }
> = async (req, res) => {
  const productId = req.params.id;
  const query = queryReviewsSchema.parse(req.query);

  let selfReviewPromise: Promise<Review | undefined> | undefined = undefined;
  if (req.user && !query.cursor) {
    selfReviewPromise = db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.userId, req.user.id)))
      .execute()
      .then((res) => res[0]);
  }

  let cursorCondition: SQL<unknown> | undefined = undefined;
  if ((query.sort === 'desc' || !query.sort) && query.cursor)
    cursorCondition = or(
      lt(reviews.createdAt, query.cursor.value),
      and(eq(reviews.createdAt, query.cursor.value), lt(reviews.userId, query.cursor.id))
    );

  if (query.sort === 'asc' && query.cursor)
    cursorCondition = or(
      gt(reviews.createdAt, query.cursor.value),
      and(eq(reviews.createdAt, query.cursor.value), gt(reviews.userId, query.cursor.id))
    );

  const resultPromise = db
    .select({ ...selectReviewSnapshot, user: selectUserSnapshot })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(
      and(
        eq(reviews.productId, productId),
        cursorCondition,
        query.rating ? eq(reviews.rating, query.rating) : undefined
      )
    )
    .limit(query.limit)
    .orderBy((t) => {
      if (query.sort === 'asc') return [asc(t.createdAt), asc(t.userId)];
      return [desc(t.createdAt), desc(t.userId)];
    })
    .execute();

  const [selfReview, result] = await Promise.all([selfReviewPromise, resultPromise]);

  let cursor: string | undefined = undefined;
  const lastResult = result[result.length - 1];
  if (lastResult) cursor = encodeCursor({ id: lastResult.userId, value: lastResult.createdAt });
  if (selfReview && req.user) result.unshift({ ...selfReview, user: req.user });

  res.json({ cursor, reviews: result });
};

export const deleteReview: RequestHandler<{ id: string }> = async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const productId = req.params.id;
  const userId = req.user.id;

  const [result] = await db
    .delete(reviews)
    .where(and(eq(reviews.userId, userId), eq(reviews.productId, productId)))
    .returning();

  if (!result) throw new NotFoundException('Review does not exist');

  res.json({ message: 'Review deleted successfully' });
};
