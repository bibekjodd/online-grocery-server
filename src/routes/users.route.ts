import {
  getProfile,
  getUserDetails,
  queryUsers,
  requestAccountVerificationOtp,
  updateProfile,
  verifyUserAccount
} from '@/controllers/users.controller';
import { Router } from 'express';

const router = Router();
export const usersRoute = router;

router.route('/').get(queryUsers);
router.route('/profile').get(getProfile).put(updateProfile);
router.post('/otp/request', requestAccountVerificationOtp);
router.post('/otp/verify', verifyUserAccount);
router.route('/:id').get(getUserDetails);
