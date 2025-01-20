import { responseNotificationSchema } from '@/db/notifications.schema';
import { getNotificationsQuerySchema } from '@/dtos/notifications.dto';
import { z } from 'zod';
import { ZodOpenApiPathsObject } from 'zod-openapi';

const tags = ['Notification'];
export const notificationsDoc: ZodOpenApiPathsObject = {
  '/api/notifications': {
    get: {
      tags,
      summary: 'Fetch notifications of user',
      requestParams: { query: getNotificationsQuerySchema },
      responses: {
        200: {
          description: 'Notifications fetched successfully',
          content: {
            'application/json': {
              schema: z.object({
                cursor: z.string().optional(),
                notifications: z.array(responseNotificationSchema)
              })
            }
          }
        },
        400: { description: 'Invalid request query' },
        401: { description: 'User is not authorized' }
      }
    }
  },
  '/api/notifications/read': {
    put: {
      tags,
      summary: 'Read notification',
      responses: {
        200: {
          description: 'Notification read successfully'
        }
      }
    }
  }
};
