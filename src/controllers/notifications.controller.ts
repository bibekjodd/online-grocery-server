import { db } from '@/db';
import { notifications, ResponseNotification } from '@/db/notifications.schema';
import { users } from '@/db/users.schema';
import { getNotificationsQuerySchema } from '@/dtos/notifications.dto';
import { UnauthorizedException } from '@/lib/exceptions';
import { encodeCursor } from '@/lib/utils';
import { and, asc, desc, eq, gt, lt, or } from 'drizzle-orm';
import { RequestHandler } from 'express';

export const getNotifications: RequestHandler<
  unknown,
  { cursor: string | undefined; notifications: ResponseNotification[] }
> = async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const query = getNotificationsQuerySchema.parse(req.query);
  const result = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, req.user.id),
        query.cursor && query.sort === 'desc'
          ? or(
              lt(notifications.createdAt, query.cursor.value),
              and(
                eq(notifications.createdAt, query.cursor.value),
                lt(notifications.id, query.cursor.id)
              )
            )
          : undefined,
        query.cursor && query.sort === 'asc'
          ? or(
              gt(notifications.createdAt, query.cursor.value),
              and(
                eq(notifications.createdAt, query.cursor.value),
                gt(notifications.id, query.cursor.id)
              )
            )
          : undefined
      )
    )
    .orderBy((t) => {
      if (query.sort === 'asc') return [asc(t.createdAt), asc(t.id)];
      return [desc(t.createdAt), desc(t.id)];
    })
    .limit(query.limit);

  const lastResult = result[result.length - 1];
  let cursorResponse: string | undefined = undefined;
  if (lastResult) {
    cursorResponse = encodeCursor({ id: lastResult.id, value: lastResult.createdAt });
  }

  res.json({ cursor: cursorResponse, notifications: result });
};

export const readNotifications: RequestHandler<unknown, { message: string }> = async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  await db
    .update(users)
    .set({
      lastNotificationReadAt: new Date().toISOString(),
      totalUnreadNotifications: 0
    })
    .where(eq(users.id, req.user?.id || ''));

  res.json({ message: 'Notifications read successfully' });
};
