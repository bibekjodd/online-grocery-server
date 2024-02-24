import { env } from '@/config/env.config';
import bcrypt from 'bcryptjs';
import MongoStore from 'connect-mongo';
import { CookieOptions } from 'express';
import { SessionOptions } from 'express-session';

export const devConsole = (...args: string[]) => {
  if (env.NODE_ENV !== 'production') {
    console.log(args.join(' '));
  }
};

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production' ? true : false,
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: Date.now() + 30 * 24 * 60 * 60 * 1000
};

export const sessionOptions: SessionOptions = {
  resave: false,
  saveUninitialized: false,
  secret: env.SESSION_SECRET,
  proxy: true,
  cookie: cookieOptions,
  store: new MongoStore({ mongoUrl: env.MONGO_URI })
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
