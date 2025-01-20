import { createId } from '@paralleldrive/cuid2';
import { getTableColumns } from 'drizzle-orm';
import { boolean, pgTable, primaryKey, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable(
  'users',
  (t) => ({
    id: t.text('id').notNull().$defaultFn(createId),
    name: t.varchar('name', { length: 30 }).notNull(),
    email: t.varchar('email', { length: 40 }).notNull(),
    password: t.varchar('password', { length: 100 }),
    image: t.varchar('image', { length: 200 }),
    phone: t.integer('phone'),
    authSource: text('auth_source', { enum: ['credentials', 'google'] }).notNull(),
    isVerified: boolean('is_verified').notNull().default(false),
    role: t
      .varchar('role', { enum: ['user', 'admin'] })
      .notNull()
      .default('user'),
    createdAt: t
      .timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    address: t.varchar('address', { length: 100 }),
    lastNotificationReadAt: t
      .text('last_notification_read_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    totalUnreadNotifications: t.integer('total_unread_notifications').notNull().default(0)
  }),
  (users) => {
    return [
      primaryKey({ name: 'users_pkey', columns: [users.id] }),
      uniqueIndex('idx_email_users').on(users.email)
    ];
  }
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export const selectUserSnapshot = { ...getTableColumns(users) };
// @ts-expect-error ...
delete selectUserSnapshot.password;
// @ts-expect-error ...
delete selectUserSnapshot.totalUnreadNotifications;
// @ts-expect-error ...
delete selectUserSnapshot.lastNotificationReadAt;

export const selectUserSchema = createSelectSchema(users);
export const responseUserSchema = selectUserSchema.omit({
  password: true
});
export type ResponseUser = z.infer<typeof responseUserSchema>;
