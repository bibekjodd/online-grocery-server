import { db } from '@/db';
import { users } from '@/db/users.schema';
import { eq } from 'drizzle-orm';
import passport from 'passport';

export const serializer = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (user) user.password = null;
      return done(null, user || null);
    } catch (error) {
      return done(error, null);
    }
  });
};
