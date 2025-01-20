import {
  loginWithOtp,
  logout,
  registerUser,
  requestLoginOtp,
  updatePassword
} from '@/controllers/auth.controller';
import { loginUserSchema } from '@/dtos/auth.dto';
import { Router } from 'express';
import passport from 'passport';

const router = Router();
export const authRoute = router;

router.post('/register', registerUser);
router.post(
  '/login',
  (req, res, next) => {
    loginUserSchema.parse(req.body);
    next();
  },
  passport.authenticate('local'),
  async (req, res) => {
    res.json({ user: req.user });
  }
);

router.get(
  '/login/google',
  (req, res, next) => {
    const redirectUrl = req.query.redirect as string;
    // @ts-expect-error ...
    req.session.redirectTo = redirectUrl;
    next();
  },
  passport.authenticate('google', { scope: ['email', 'profile'] })
);
router.get('/callback/google', passport.authenticate('google'), (req, res) => {
  // @ts-expect-error ...
  const redirectUrl = req.session.redirectTo;

  // @ts-expect-error ...
  delete req.session.redirectTo;
  return res.redirect(redirectUrl || '/');
});

router.put('/password', updatePassword);
router.post('/otp/request', requestLoginOtp);
router.post('/otp/verify', loginWithOtp);
router.route('/logout').get(logout).post(logout);
