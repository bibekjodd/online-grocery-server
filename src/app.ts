import 'colors';
import cors from 'cors';
import { sql } from 'drizzle-orm';
import express from 'express';
import session from 'express-session';
import morgan from 'morgan';
import passport from 'passport';
import { db } from './config/database';
import { env, validateEnv } from './config/env.config';
import { NotFoundException } from './lib/exceptions';
import { devConsole, sessionOptions } from './lib/utils';
import { handleAsync } from './middlewares/handle-async';
import { handleErrorRequest } from './middlewares/handle-error-request';
import { GoogleStrategy } from './passport/google.strategy';
import { LocalStrategy } from './passport/local.strategy';
import { serializer } from './passport/serializer';
import { notificationRoute } from './routes/notification.route';
import { orderRoute } from './routes/order.route';
import { productRoute } from './routes/product.route';
import { reviewRoute } from './routes/review.route';
import { userRoute } from './routes/user.route';

const app = express();
validateEnv();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.enable('trust proxy');
app.use(cors({ origin: env.FRONTEND_URLS, credentials: true }));
if (env.NODE_ENV === 'development') {
  app.use(morgan('common'));
}
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.use('local', LocalStrategy);
passport.use('google', GoogleStrategy);
serializer();

app.get(
  '/',
  handleAsync(async (req, res) => {
    const [result] = await db.execute(sql`select version()`);
    return res.json({
      message: 'Api is running fine...',
      env: env.NODE_ENV,
      date: new Date().toISOString(),
      database: result
    });
  })
);

/* --------- routes --------- */
app.use('/api', userRoute);
app.use('/api', productRoute);
app.use('/api', reviewRoute);
app.use('/api', orderRoute);
app.use('/api', notificationRoute);
app.use(() => {
  throw new NotFoundException();
});
app.use(handleErrorRequest);

if (env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    devConsole(`⚡[Server]: listening at http://localhost:${env.PORT}`.yellow);
  });
}
export default app;
