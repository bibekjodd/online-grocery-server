import {
  cancelOrder,
  getMyOrders,
  getOrdersOnMyProducts,
  placeOrder,
  updateOrder
} from '@/controllers/order.controller';
import { Router } from 'express';

const router = Router();
export const orderRoute = router;

router
  .route('/order/:id')
  .post(placeOrder)
  .put(updateOrder)
  .delete(cancelOrder);

router.get('/my-orders', getMyOrders);
router.get('/orders', getOrdersOnMyProducts);
