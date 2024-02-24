import { db } from '@/config/database';
import {
  getOrdersOnMyProductsSchema,
  getOrdersSchema,
  placeOrderSchema,
  updateOrderSchema
} from '@/dtos/order.dto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException
} from '@/lib/exceptions';
import { handleAsync } from '@/middlewares/handle-async';
import { orders, selectOrderSnapshot } from '@/schemas/order.schema';
import { products, selectProductSnapshot } from '@/schemas/product.schema';
import { selectUserSnapshot, users } from '@/schemas/user.schema';
import { and, desc, eq, lt, sql } from 'drizzle-orm';

export const placeOrder = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const productId = req.params.id;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product) throw new NotFoundException('Product does not exist');
  if (product.ownerId === req.user.id)
    throw new BadRequestException("You can't place order on your own product");

  const { address, paymentType, quantity } = placeOrderSchema.parse(req.body);
  if (product.stock < quantity) {
    throw new BadRequestException(
      `Requested to place order for ${quantity} items but only ${product.stock} items are available`
    );
  }

  const price = product.price - (product.price * product.discount) / 100;
  const totalPrice = price * quantity;
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const estimatedDeliveryDate = new Date(Date.now() + SEVEN_DAYS).toISOString();

  await db.insert(orders).values({
    sellerId: product.ownerId,
    address,
    paymentType,
    estimatedDeliveryDate,
    price,
    productId: product.id,
    totalPrice,
    userId: req.user.id,
    quantity
  });

  db.update(products)
    .set({ stock: sql`${products.stock}-${quantity}` })
    .where(eq(products.id, productId))
    .execute();

  return res.json({ message: 'Your order is placed successfully' });
});

export const updateOrder = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const orderId = req.params.id;
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.sellerId, req.user.id)));

  if (!order) {
    throw new NotFoundException(
      'Order not found or you are not allowed to update this order'
    );
  }

  if (order.status === 'cancelled' || order.status === 'delivered')
    throw new ForbiddenException(`Order is already ${order.status}`);

  const { paid, delivered } = updateOrderSchema.parse(req.body);
  if (paid === false)
    throw new BadRequestException('Invalid value sent for paid property');

  db.update(orders)
    .set({
      paid: paid || !!delivered || undefined,
      deliveredAt: delivered ? new Date().toISOString() : undefined,
      status: delivered ? 'delivered' : undefined
    })
    .where(eq(orders.id, orderId))
    .execute();

  return res.json({ message: 'Order updated successfully' });
});

export const cancelOrder = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();
  const orderId = req.params.id;
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw new NotFoundException('Order not found');

  if (order.sellerId !== req.user.id) {
    if (req.user.role !== 'admin')
      throw new ForbiddenException(
        'You must be admin or seller to preform this action'
      );
  }

  if (order.status !== 'processing')
    throw new BadRequestException(`Order is already ${order.status}`);

  db.update(orders)
    .set({ status: 'cancelled' })
    .where(eq(orders.id, orderId))
    .execute();
  db.update(products)
    .set({ stock: sql`${products.stock}+${order.quantity}` })
    .where(eq(products.id, order.productId))
    .execute();

  return res.json({ message: 'Order cancelled successfully' });
});

export const getMyOrders = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const { limit, cursor } = getOrdersSchema.parse(req.query);

  const result = await db
    .select({
      ...selectOrderSnapshot,
      seller: selectUserSnapshot,
      product: selectProductSnapshot
    })
    .from(orders)
    .where(and(eq(orders.userId, req.user.id), lt(orders.orderedAt, cursor)))
    .innerJoin(users, eq(orders.sellerId, users.id))
    .innerJoin(products, eq(orders.productId, products.id))
    .groupBy(orders.id, users.id, products.id)
    .orderBy(desc(orders.orderedAt))
    .limit(limit);

  const finalResult = result.map((order) => ({ ...order, user: req.user }));
  return res.json({ total: finalResult.length, orders: finalResult });
});

export const getOrdersOnMyProducts = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const { limit, cursor } = getOrdersOnMyProductsSchema.parse(req.query);
  const result = await db
    .select({
      ...selectOrderSnapshot,
      user: selectUserSnapshot,
      product: selectProductSnapshot
    })
    .from(orders)
    .where(and(eq(orders.sellerId, req.user.id), lt(orders.orderedAt, cursor)))
    .innerJoin(users, eq(orders.userId, users.id))
    .innerJoin(products, eq(orders.productId, products.id))
    .groupBy(orders.id, users.id, products.id)
    .orderBy(desc(orders.orderedAt))
    .limit(limit);

  const finalResult = result.map((order) => ({ ...order, seller: req.user }));
  return res.json({ total: finalResult.length, orders: finalResult });
});
