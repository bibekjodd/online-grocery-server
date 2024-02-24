import { env } from '@/config/env.config';
import {
  deleteProfile,
  getProfile,
  logoutUser,
  registerUser,
  requestEmailVerificationCode,
  updateProfile,
  verifyEmail
} from '@/controllers/user.controller';
import express from 'express';
import passport from 'passport';

const router = express.Router();
export const userRoute = router;

router.post('/register', registerUser);
router.post('/login', passport.authenticate('local'), getProfile);
router.get('/logout', logoutUser);
router.get(
  '/login/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);
router.get('/callback/google', passport.authenticate('google'), (req, res) => {
  return res.redirect(env.AUTH_REDIRECT_URI);
});

router
  .route('/profile')
  .get(getProfile)
  .put(updateProfile)
  .delete(deleteProfile);

router.get('/verify-email', requestEmailVerificationCode);
router.post('/verify-email', verifyEmail);
