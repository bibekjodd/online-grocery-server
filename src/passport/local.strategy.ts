import { db } from '@/config/database';
import { loginUserSchema } from '@/dtos/user.dto';
import { BadRequestException } from '@/lib/exceptions';
import { verifyPassword } from '@/lib/utils';
import { users } from '@/schemas/user.schema';
import { eq } from 'drizzle-orm';
import { Strategy } from 'passport-local';

export const LocalStrategy = new Strategy(
  { usernameField: 'email', passwordField: 'password' },
  async (email, password, done) => {
    loginUserSchema.parse({ email, password });
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!user) {
        return done(
          new BadRequestException('Invalid user credentials'),
          undefined
        );
      }
      if (user.isGoogleUser)
        return done(new BadRequestException('Try signing in with google'));

      const isPasswordMatched = await verifyPassword(password, user.password!);
      if (!isPasswordMatched) {
        return done(
          new BadRequestException('Invalid user credentials'),
          undefined
        );
      }

      done(null, { ...user, password: undefined });
    } catch (error) {
      done(new BadRequestException('Invalid user credentials'), undefined);
    }
  }
);
