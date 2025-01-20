import { createId } from '@paralleldrive/cuid2';
import { getTableColumns } from 'drizzle-orm';
import { foreignKey, index, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users.schema';

export const notifications = pgTable(
  'notifications',
  (t) => ({
    id: t.text().notNull().$defaultFn(createId),
    userId: t.text('user_id').notNull(),
    title: t.varchar({ length: 200 }).notNull(),
    description: t.varchar({ length: 400 }),
    createdAt: t
      .text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    entity: t.text().notNull(),
    params: t.text(),
    type: t.text()
  }),

  (notifications) => [
    primaryKey({ name: 'notifications_pkey', columns: [notifications.id] }),
    foreignKey({
      name: 'fk_user_id',
      columns: [notifications.userId],
      foreignColumns: [users.id]
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    index('idx_user_id_notifications').on(notifications.userId),
    index('idx_received_at').on(notifications.createdAt)
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export const selectNotificationSnapshot = getTableColumns(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);
export const responseNotificationSchema = selectNotificationSchema;
export type ResponseNotification = z.infer<typeof responseNotificationSchema>;
