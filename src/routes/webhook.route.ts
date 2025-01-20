import { webhookController } from '@/controllers/webhooks.controller';
import { Router } from 'express';

const router = Router();
export const webhooksRoute = router;

router.post('/', webhookController);
