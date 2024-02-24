import { db } from '@/config/database';
import { registerUserSchema, updateProfileSchema } from '@/dtos/user.dto';
import { BadRequestException, UnauthorizedException } from '@/lib/exceptions';
import { sendMail } from '@/lib/send-mail';
import { hashPassword } from '@/lib/utils';
import { handleAsync } from '@/middlewares/handle-async';
import { selectUserSnapshot, users } from '@/schemas/user.schema';
import { verifyAccounts } from '@/schemas/verify.schema';
import { and, eq, gte } from 'drizzle-orm';

export const registerUser = handleAsync(async (req, res) => {
  const data = registerUserSchema.parse(req.body);
  const hashedPassword = await hashPassword(data.password);

  const [user] = await db
    .insert(users)
    .values({ ...data, password: hashedPassword })
    .onConflictDoNothing({ target: [users.email] })
    .returning(selectUserSnapshot);

  if (!user) {
    throw new BadRequestException('User with same email already exists');
  }
  return res.json({ user });
});

export const getProfile = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  return res.json({ user: req.user });
});

export const updateProfile = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const { name, image } = updateProfileSchema.parse(req.body);
  db.update(users)
    .set({ name, image })
    .where(eq(users.id, req.user.id))
    .execute();
  return res.json({ message: 'Profile updated successfully' });
});

export const logoutUser = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  req.session.destroy(() => {});
  req.logout(() => {});
  return res.json({ message: 'Logged out successfully' });
});

export const deleteProfile = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  await db.delete(users).where(eq(users.id, req.user.id));
  req.session.destroy(() => {});
  req.logout(() => {});
  return res.json({ message: 'Profile deleted successfully' });
});

export const requestEmailVerificationCode = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  if (req.user.isVerified)
    throw new BadRequestException('Your account is already verified!');

  const code = Math.random().toString().slice(2, 6);
  const FIVE_MINUTES = 5 * 60 * 1000;
  const expiresAt = new Date(Date.now() + FIVE_MINUTES).toISOString();

  db.insert(verifyAccounts)
    .values({ userId: req.user.id, code, expiresAt })
    .onConflictDoUpdate({
      target: [verifyAccounts.userId],
      set: {
        code,
        expiresAt
      }
    })
    .execute();
  const mailBody = `<h3>Your email verification code is</h3>
<h2>${code}</h2>
<h5>This code will expire after 5 minutes</h5>
`;
  sendMail({
    to: req.user.email,
    subject: 'Email verification Code',
    body: mailBody
  });

  return res.json({
    message: `The verification code is sent at ${req.user.email}`
  });
});

export const verifyEmail = handleAsync<unknown, unknown, { code: string }>(
  async (req, res) => {
    if (!req.user) throw new UnauthorizedException();
    if (req.user.isVerified)
      throw new BadRequestException('Your account is already verified');

    if (typeof req.body.code !== 'string')
      throw new BadRequestException('Invalid code sent');
    if (req.body.code.length !== 4)
      throw new BadRequestException('Invalid code sent');

    const [result] = await db
      .select()
      .from(verifyAccounts)
      .where(
        and(
          eq(verifyAccounts.userId, req.user.id),
          gte(verifyAccounts.expiresAt, new Date().toISOString()),
          eq(verifyAccounts.code, req.body.code)
        )
      )
      .limit(1);
    if (!result) {
      throw new BadRequestException(
        'Verification code expired or invalid code provided'
      );
    }

    db.update(users)
      .set({ isVerified: true })
      .where(eq(users.id, req.user.id))
      .execute();
    db.delete(verifyAccounts)
      .where(eq(verifyAccounts.userId, req.user.id))
      .execute();

    return res.json({ message: 'Your account is now verified!' });
  }
);
