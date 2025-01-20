import { db } from '@/db';
import { otps } from '@/db/otps.schema';
import { selectUserSnapshot, User, users } from '@/db/users.schema';
import {
  loginWithOtpSchema,
  registerUserSchema,
  requestOtpLoginSchema,
  updatePasswordSchema
} from '@/dtos/auth.dto';
import { MILLIS } from '@/lib/constants';
import {
  BadRequestException,
  InternalServerException,
  NotFoundException,
  UnauthorizedException
} from '@/lib/exceptions';
import { sendMail } from '@/lib/send-mail';
import { generateOtp, hashPassword } from '@/lib/utils';
import { and, eq } from 'drizzle-orm';
import { RequestHandler } from 'express';

export const registerUser: RequestHandler<unknown, { user: User }> = async (req, res) => {
  const data = registerUserSchema.parse(req.body);
  let [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);

  if (user && user.authSource !== 'credentials')
    throw new BadRequestException(
      `You are previously logged in with ${user.authSource}! Try logging from ${user.authSource}`
    );
  if (user) throw new BadRequestException('User with the same email already exists');

  const password = await hashPassword(data.password);
  user = await db
    .insert(users)
    .values({ ...data, password, authSource: 'credentials' })
    .returning()
    .execute()
    .then((res) => res[0]);

  if (!user) throw new InternalServerException();
  user.password = null;

  req.logIn(user, () => {
    res.status(201).json({ user });
  });
};

export const logout: RequestHandler = async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  req.logOut(() => {
    res.json({ message: 'Logged out successfully' });
  });
};

export const updatePassword: RequestHandler = async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const { password } = updatePasswordSchema.parse(req.body);

  const hashedPassword = await hashPassword(password);
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, req.user.id));

  res.json({ message: 'Password changed successfully' });
};

export const requestLoginOtp: RequestHandler = async (req, res) => {
  const { email } = requestOtpLoginSchema.parse(req.body);
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new NotFoundException(`User with email ${email} does not exist`);

  const otp = generateOtp();
  const createdAt = new Date();
  const expiresAt = new Date(Date.now() + MILLIS.MINUTE);
  await Promise.all([
    db
      .insert(otps)
      .values({
        otp,
        type: 'login',
        userId: user.id,
        createdAt,
        expiresAt
      })
      .onConflictDoUpdate({
        target: [otps.userId, otps.type],
        set: {
          otp,
          createdAt,
          expiresAt
        }
      }),

    sendMail({
      mail: user.email,
      subject: `Login otp for sabkobazzar`,
      text: `Your login otp for sabkobazzar is <strong>${otp}</strong><br>Use it within a minutes before it expires`
    })
  ]);

  res.json({ message: 'Login otp is sent to your mail' });
};

export const loginWithOtp: RequestHandler<unknown, { user: User }> = async (req, res) => {
  const { email, otp } = loginWithOtpSchema.parse(req.body);
  const [result] = await db
    .select({ otp: otps.otp, expiresAt: otps.expiresAt, user: selectUserSnapshot })
    .from(otps)
    .innerJoin(users, and(eq(otps.userId, users.id), eq(users.email, email)))
    .limit(1);

  if (!result || result.otp !== otp || result.expiresAt.toISOString() < new Date().toISOString())
    throw new BadRequestException('Invalid otp');

  const { user } = result;
  user.password = null;
  await db.delete(otps).where(and(eq(otps.userId, user.id), eq(otps.type, 'login')));

  req.login(user, () => {
    res.json({ user });
  });
};
