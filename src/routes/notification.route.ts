import { getNotifications } from '@/controllers/notification.controller';
import { Router } from 'express';

const router = Router();
export const notificationRoute = router;

router.get('/notifications', getNotifications);
