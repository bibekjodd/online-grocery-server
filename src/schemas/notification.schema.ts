import {
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';
import { users } from './user.schema';

export const notifications = pgTable(
  'notifications',
  {
    userId: text('user_id').notNull(),
    title: varchar('title', { length: 100 }).notNull(),
    description: varchar('description', { length: 300 }),
    createdAt: timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow()
  },
  function constraints(notifications) {
    return {
      userReference: foreignKey({
        name: 'fk_user_id',
        columns: [notifications.userId],
        foreignColumns: [users.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      indexUser: index('notifications_idx_user_id').on(notifications.userId)
    };
  }
);
