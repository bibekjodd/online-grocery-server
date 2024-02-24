import { db } from '@/config/database';
import { env } from '@/config/env.config';
import { BadRequestException } from '@/lib/exceptions';
import { selectUserSnapshot, users } from '@/schemas/user.schema';
import { eq } from 'drizzle-orm';
import { Strategy } from 'passport-google-oauth20';

export const GoogleStrategy = new Strategy(
  {
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    passReqToCallback: true,
    callbackURL: env.GOOGLE_CALLBACK_URL
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const id: string = profile.id;
      const name: string = profile.displayName;
      const email: string = profile.emails?.at(0)?.value || '';
      const image: string | null = profile.photos?.at(0)?.value || null;
      let [user] = await db
        .select(selectUserSnapshot)
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user && !user.isGoogleUser) {
        return done(
          new BadRequestException(
            'This account is previously signed in with credential authentication'
          )
        );
      }

      if (!user) {
        [user] = await db
          .insert(users)
          .values({ id, name, email, image, isGoogleUser: true })
          .returning(selectUserSnapshot);
      }
      if (!user) return done(null, undefined);
      done(null, user);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
);
