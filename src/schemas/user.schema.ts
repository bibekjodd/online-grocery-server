import { createId } from '@paralleldrive/cuid2';
import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').notNull().$defaultFn(createId),
    name: varchar('name', { length: 30 }).notNull(),
    email: varchar('email', { length: 40 }).notNull(),
    password: varchar('password', { length: 100 }),
    image: varchar('image', { length: 200 }),
    isGoogleUser: boolean('is_google_user').notNull().default(false),
    isVerified: boolean('is_verified').notNull().default(false),
    role: varchar('role', { enum: ['user', 'admin'] })
      .notNull()
      .default('user'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow()
  },
  function constraints(users) {
    return {
      primaryKey: primaryKey({ name: 'users_pkey', columns: [users.id] }),
      uniqueEmail: unique('email').on(users.email)
    };
  }
);
export type User = typeof users.$inferInsert;
export const selectUserSnapshot = {
  id: users.id,
  name: users.name,
  email: users.email,
  image: users.image,
  isGoogleUser: users.isGoogleUser,
  role: users.role,
  createdAt: users.createdAt,
  isVerified: users.isVerified
};
export type UserSnapshot = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isGoogleUser: boolean;
  role: 'user' | 'admin';
  createdAt: string;
  password?: undefined;
  isVerified: boolean;
};
