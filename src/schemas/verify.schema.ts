import {
  char,
  foreignKey,
  pgTable,
  primaryKey,
  text,
  timestamp
} from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const verifyAccounts = pgTable(
  'verify_accounts',
  {
    userId: text('user_id').notNull(),
    code: char('code', { length: 4 }).notNull(),
    expiresAt: timestamp('expires_at', {
      mode: 'string',
      withTimezone: true
    }).notNull()
  },
  function constraints(verifyAccounts) {
    return {
      userReference: foreignKey({
        name: 'fk_user_id',
        columns: [verifyAccounts.userId],
        foreignColumns: [users.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      primaryKey: primaryKey({
        name: 'pkey_verify_accounts',
        columns: [verifyAccounts.userId]
      })
    };
  }
);
