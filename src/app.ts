import 'colors';
import cookieSession from 'cookie-session';
import cors from 'cors';
import { sql } from 'drizzle-orm';
import express from 'express';
import morgan from 'morgan';
import passport from 'passport';
import { env, validateEnv } from './config/env.config';
import { db } from './db';
import { NotFoundException } from './lib/exceptions';
import { devConsole, sessionOptions } from './lib/utils';
import { handleErrorRequest } from './middlewares/handle-error-request';
import { handleSessionRegenerate } from './middlewares/handle-session-regenerate';
import { openApiSpecs, serveApiReference } from './openapi';
import { GoogleStrategy } from './passport/google.strategy';
import { LocalStrategy } from './passport/local.strategy';
import { serializer } from './passport/serializer';
import { authRoute } from './routes/auth.route';
import { notificationsRoute } from './routes/notifications.route';
import { ordersRoute } from './routes/orders.route';
import { productsRoute } from './routes/products.route';
import { reviewsRoute } from './routes/reviews.route';
import { usersRoute } from './routes/users.route';
import { webhooksRoute } from './routes/webhook.route';

const app = express();
validateEnv();
app.use('/api/webhooks', express.text({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.enable('trust proxy');
app.use(cors({ origin: env.FRONTEND_URLS, credentials: true }));
if (env.NODE_ENV === 'development') {
  app.use(morgan('common'));
}
app.use(cookieSession(sessionOptions));
app.use(handleSessionRegenerate);
// @ts-expect-error ...
app.use(passport.initialize());
app.use(passport.session());
passport.use('local', LocalStrategy);
passport.use('google', GoogleStrategy);
serializer();

app.get('/', async (req, res) => {
  const [result] = await db.execute(sql`select version()`);
  res.json({
    message: 'Api is running fine...',
    env: env.NODE_ENV,
    date: new Date().toISOString(),
    database: result
  });
});

/* --------- routes --------- */
app.use('/api/auth', authRoute);
app.use('/api/users', usersRoute);
app.use('/api/products', productsRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/webhooks', webhooksRoute);
app.use('/api/reviews', reviewsRoute);
app.use('/api/notifications', notificationsRoute);
app.get('/doc', (req, res) => {
  res.json(openApiSpecs);
});
app.get('/reference', serveApiReference);

app.use(() => {
  throw new NotFoundException();
});
app.use(handleErrorRequest);

app.listen(env.PORT, () => {
  devConsole(`⚡[Server]: listening at http://localhost:${env.PORT}`.yellow);
});
export default app;
