import { env } from '@/config/env.config';
import { db } from '@/db';
import { users } from '@/db/users.schema';
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
      const name: string = profile.displayName;
      const email: string = profile.emails?.at(0)?.value || '';
      const image: string | null = profile.photos?.at(0)?.value || null;

      const [user] = await db
        .insert(users)
        .values({ name, email, image, authSource: 'google' })
        .onConflictDoUpdate({
          target: [users.email],
          set: {
            email
          }
        })
        .returning()
        .execute();

      if (!user) return done(null, undefined);
      return done(null, user);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
);
