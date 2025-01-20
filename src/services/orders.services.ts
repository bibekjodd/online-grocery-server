import { db } from '@/db';
import { orders, ResponseOrder, selectOrderSnapshot } from '@/db/orders.schema';
import { users } from '@/db/users.schema';
import { NotFoundException } from '@/lib/exceptions';
import { eq, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export const findOrderDetails = async (orderId: string): Promise<ResponseOrder> => {
  const seller = alias(users, 'seller');
  const customer = alias(users, 'customer');
  const [order] = await db
    .select({
      ...selectOrderSnapshot,
      seller: getTableColumns(seller),
      customer: getTableColumns(customer)
    })
    .from(orders)
    .innerJoin(seller, eq(orders.sellerId, seller.id))
    .innerJoin(customer, eq(orders.customerId, customer.id))
    .where(eq(orders.id, orderId))
    .groupBy((t) => [t.id, t.sellerId, t.customerId]);

  if (!order) throw new NotFoundException('Order does not exist');
  return order;
};
