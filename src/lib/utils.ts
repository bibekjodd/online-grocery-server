import { env } from '@/config/env.config';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import dayjs from 'dayjs';
import { BadRequestException } from './exceptions';

export const devConsole = (...args: string[]) => {
  if (env.NODE_ENV !== 'production') {
    console.log(args.join(' '));
  }
};

export const sessionOptions: CookieSessionInterfaces.CookieSessionOptions = {
  name: 'session',
  keys: [env.SESSION_SECRET],
  maxAge: 365 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: env.NODE_ENV !== 'production' ? false : true,
  sameSite: env.NODE_ENV !== 'production' ? 'lax' : 'none'
};

export const formatDate = (value: string | Date | number) => {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset() + 345);
  return dayjs(date).format('dddd, MMM DD, ha');
};

export const formatPrice = (price: number, prefix = true) => {
  const formattedPrice = new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(
    price
  );
  if (prefix) return 'Rs. ' + formattedPrice;
  return formattedPrice;
};

export const encodeCursor = (val: { id: string; value: unknown }): string =>
  btoa(JSON.stringify(val));

export const decodeCursor = <Result = Record<string, unknown>>(val: string): Result => {
  try {
    return JSON.parse(atob(val));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    throw new BadRequestException('Invalid cursor');
  }
};

export const generateOtp = () => randomInt(111_111, 999_999).toString();

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const comparePassword = (password: string, hash: string) => bcrypt.compare(password, hash);
