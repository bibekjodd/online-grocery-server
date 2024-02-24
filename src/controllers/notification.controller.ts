import { db } from '@/config/database';
import { getNotificationsSchema } from '@/dtos/notification.dto';
import { UnauthorizedException } from '@/lib/exceptions';
import { handleAsync } from '@/middlewares/handle-async';
import { notifications } from '@/schemas/notification.schema';
import { and, desc, eq, lt } from 'drizzle-orm';

export const getNotifications = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const { limit, cursor } = getNotificationsSchema.parse(req.query);
  const result = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, req.user.id),
        lt(notifications.createdAt, cursor)
      )
    )
    .limit(limit)
    .orderBy(desc(notifications.createdAt));

  return res.json({ total: result.length, notifications: result });
});
