import { deleteReview, getReviews, postReview } from '@/controllers/reviews.controller';
import { Router } from 'express';

const router = Router();
export const reviewsRoute = router;

router.route('/:id').post(postReview).get(getReviews).delete(deleteReview);
