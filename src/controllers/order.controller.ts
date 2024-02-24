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
import { sendMail } from '@/lib/send-mail';
import { handleAsync } from '@/middlewares/handle-async';
import { orders, selectOrderSnapshot } from '@/schemas/order.schema';
import { products, selectProductSnapshot } from '@/schemas/product.schema';
import { selectUserSnapshot, users } from '@/schemas/user.schema';
import { addNotification } from '@/services/notification.service';
import { updateOnSales } from '@/services/sales.service';
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
    price: Math.ceil(price),
    productId: product.id,
    totalPrice: Math.ceil(totalPrice),
    userId: req.user.id,
    quantity
  });

  db.update(products)
    .set({ stock: sql`${products.stock}-${quantity}` })
    .where(eq(products.id, productId))
    .execute();

  addNotification({
    title: `Product - ${product.title} has got order`,
    userId: product.ownerId,
    description: 'You can track order through dashboard'
  });
  addNotification({
    title: `Order for product - ${product.title} placed successfully`,
    userId: req.user.id
  });
  if (req.user.hasOptedNotification) {
    sendMail({
      to: req.user.email,
      subject: `Order for proudct ${product.title} placed successfully`,
      body: `<h3>The product will be deliverd at ${address} within 7 days. Thanks you for opting out platform</h3>`
    });
  }

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

  if (delivered) {
    const deliveryDays =
      new Date(new Date().toISOString()).getDate() -
      new Date(order.orderedAt).getDate();
    updateOnSales({
      amount: order.totalPrice,
      quantity: order.quantity,
      userId: order.sellerId,
      productId: order.productId,
      deliveryDays
    });
    const [product] = await db
      .select({ title: products.title })
      .from(products)
      .where(eq(products.id, order.productId));
    if (product?.title) {
      addNotification({
        title: `Product - ${product.title} is delivered succesfullly to ${order.address}`,
        userId: order.userId
      });
      addNotification({
        title: `Product - ${product.title} is delivered to user successfully`,
        userId: req.user.id
      });
    }
  }

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

  const deliveryDays =
    new Date(new Date().toISOString()).getDate() -
    new Date(order.orderedAt).getDate();
  updateOnSales({
    amount: 0,
    deliveryDays,
    quantity: order.quantity,
    isCancelled: true,
    productId: order.productId,
    userId: order.sellerId
  });

  db.update(orders)
    .set({ status: 'cancelled' })
    .where(eq(orders.id, orderId))
    .execute();
  db.update(products)
    .set({ stock: sql`${products.stock}+${order.quantity}` })
    .where(eq(products.id, order.productId))
    .returning()
    .execute()
    .then(([product]) => {
      if (!product) return;
      addNotification({
        title: `Order for product ${product.title} is cancelled`,
        userId: order.userId
      });
      addNotification({
        title: `Order for product ${product.title} is cancelled`,
        userId: order.sellerId
      });
    });

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
