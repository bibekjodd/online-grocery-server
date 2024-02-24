import {
  deleteReview,
  getReviews,
  postReview
} from '@/controllers/review.controller';
import { Router } from 'express';

const router = Router();
export const reviewRoute = router;

router.post('/review/:id', postReview);
router.get('/reviews/:id', getReviews);
router.delete('/review/:id', deleteReview);
