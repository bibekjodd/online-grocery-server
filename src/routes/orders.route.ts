import { getOrderDetails, queryOrders, updateOrderStatus } from '@/controllers/orders.controller';
import { Router } from 'express';

const router = Router();
export const ordersRoute = router;

router.get('/', queryOrders);
router.route('/:id').get(getOrderDetails);
router.put('/:id/status', updateOrderStatus);
