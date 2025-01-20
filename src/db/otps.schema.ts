import { foreignKey, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const otps = pgTable(
  'otps',
  (t) => ({
    userId: t.text('user_id').notNull(),
    otp: t.varchar('otp', { length: 6 }).notNull(),
    createdAt: t.timestamp('created_at').notNull().defaultNow(),
    expiresAt: t.timestamp('expires_at', { withTimezone: true }).notNull(),
    type: t.text({ enum: ['account-verification', 'login'] }).notNull()
  }),
  (otps) => [
    primaryKey({ name: 'otps_pkey', columns: [otps.userId, otps.type] }),
    foreignKey({ name: 'fk_user_id', columns: [otps.userId], foreignColumns: [users.id] })
  ]
);
