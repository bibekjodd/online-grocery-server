import { db } from '@/config/database';
import {
  InsertNotification,
  notifications
} from '@/schemas/notification.schema';

export const addNotification = async (data: InsertNotification) => {
  return db
    .insert(notifications)
    .values(data)
    .returning()
    .execute()
    .then(([res]) => res || null)
    .catch(() => null);
};
