import { db } from '@/db';
import { orders, ResponseOrder, selectOrderSnapshot } from '@/db/orders.schema';
import { users } from '@/db/users.schema';
import { queryOrdersSchema, updateOrderStatusSchema } from '@/dtos/orders.dto';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@/lib/exceptions';
import { encodeCursor } from '@/lib/utils';
import { findOrderDetails } from '@/services/orders.services';
import { and, asc, desc, eq, getTableColumns, gt, gte, lt, lte, or, SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { RequestHandler } from 'express';

export const queryOrders: RequestHandler<
  unknown,
  { cursor: string | undefined; orders: ResponseOrder[] }
> = async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const query = queryOrdersSchema.parse(req.query);

  if (req.user.role !== 'admin' && (query.customer || query.seller))
    throw new ForbiddenException('You are not allowed to access this resource');

  if (req.user.role !== 'admin' && query.resource)
    throw new BadRequestException('Resource type not specified');

  let cursorCondition: SQL<unknown> | undefined = undefined;

  if ((query.sort === 'ordered_at_desc' || !query.sort) && query.cursor)
    cursorCondition = or(
      lt(orders.orderedAt, query.cursor.value),
      and(eq(orders.orderedAt, query.cursor.value), lt(orders.id, query.cursor.id))
    );

  if (query.sort === 'ordered_at_asc' && query.cursor)
    cursorCondition = or(
      gt(orders.orderedAt, query.cursor.value),
      and(eq(orders.orderedAt, query.cursor.value), gt(orders.id, query.cursor.id))
    );

  if (query.sort === 'delivered_at_desc' && query.cursor)
    cursorCondition = or(
      lt(orders.deliveredAt, query.cursor.value),
      and(eq(orders.deliveredAt, query.cursor.value), lt(orders.id, query.cursor.id))
    );

  if (query.sort === 'delivered_at_asc' && query.cursor)
    cursorCondition = or(
      gt(orders.deliveredAt, query.cursor.value),
      and(eq(orders.deliveredAt, query.cursor.value), gt(orders.id, query.cursor.id))
    );

  if (query.sort === 'amount_desc' && query.cursor)
    cursorCondition = or(
      lt(orders.amount, Number(query.cursor.value)),
      and(eq(orders.amount, Number(query.cursor.value)), lt(orders.id, query.cursor.id))
    );

  if (query.sort === 'amount_asc' && query.cursor)
    cursorCondition = or(
      gt(orders.amount, Number(query.cursor.value)),
      and(eq(orders.amount, Number(query.cursor.value)), gt(orders.id, query.cursor.id))
    );

  const seller = alias(users, 'seller');
  const customer = alias(users, 'customer');
  const result = await db
    .select({
      ...selectOrderSnapshot,
      seller: getTableColumns(seller),
      customer: getTableColumns(customer)
    })
    .from(orders)
    .innerJoin(
      seller,
      and(
        eq(orders.sellerId, seller.id),
        query.seller ? eq(seller.id, query.seller) : undefined,
        query.resource === 'seller' ? eq(seller.id, req.user.id) : undefined
      )
    )
    .innerJoin(
      customer,
      and(
        eq(orders.customerId, customer.id),
        query.customer ? eq(customer.id, query.customer) : undefined,
        query.resource === 'customer' ? eq(customer.id, req.user.id) : undefined
      )
    )
    .where(
      and(
        cursorCondition,
        query.from ? gte(orders.orderedAt, query.from) : undefined,
        query.to ? lte(orders.orderedAt, query.to) : undefined,
        query.status ? eq(orders.status, query.status) : undefined,
        query.product ? eq(orders.productId, query.product) : undefined
      )
    )
    .groupBy((t) => [t.id, t.sellerId, t.customerId])
    .limit(query.limit)
    .orderBy((t) => {
      if (query.sort === 'delivered_at_asc') return [asc(t.deliveredAt), asc(t.id)];
      if (query.sort === 'delivered_at_desc') return [desc(t.deliveredAt), desc(t.id)];
      if (query.sort === 'amount_asc') return [asc(t.amount), asc(t.id)];
      if (query.sort === 'amount_desc') return [desc(t.amount), desc(t.id)];
      if (query.sort === 'ordered_at_asc') return [asc(t.orderedAt), asc(t.id)];
      return [desc(t.amount), desc(t.id)];
    });

  let cursor: string | undefined = undefined;
  const lastResult = result[result.length - 1];
  if (lastResult) {
    let cursorValue: unknown = undefined;
    if (query.sort === 'amount_asc' || query.sort === 'amount_desc')
      cursorValue = lastResult.amount;
    else if (query.sort === 'delivered_at_asc' || query.sort === 'delivered_at_desc')
      cursorValue = lastResult.deliveredAt;
    else cursorValue = lastResult.orderedAt;
    cursor = encodeCursor({ value: cursorValue, id: lastResult.id });
  }

  res.json({ orders: result, cursor });
};

export const getOrderDetails: RequestHandler<{ id: string }, { order: ResponseOrder }> = async (
  req,
  res
) => {
  if (!req.user) throw new UnauthorizedException();
  const orderId = req.params.id;
  const order = await findOrderDetails(orderId);

  if (
    !(
      req.user.role === 'admin' ||
      order.sellerId === req.user.id ||
      order.customerId === req.user.id
    )
  )
    throw new ForbiddenException('You are not allowed to access this resource');

  res.json({ order });
};

export const updateOrderStatus: RequestHandler<{ id: string }, { order: ResponseOrder }> = async (
  req,
  res
) => {
  if (!req.user) throw new UnauthorizedException();
  const orderId = req.params.id;

  const { status } = updateOrderStatusSchema.parse(req.body);

  const order = await findOrderDetails(orderId);
  if (order.status !== 'pending') throw new BadRequestException(`Order is already ${order.status}`);

  if (status === 'delivered' && !(req.user.role === 'admin' || order.sellerId === req.user.id))
    throw new ForbiddenException('You are not allowed to perform this action');

  if (
    status === 'cancelled' &&
    !(
      req.user.role === 'admin' ||
      order.sellerId === req.user.id ||
      order.customerId === req.user.id
    )
  )
    throw new ForbiddenException('You are not allowed to perform this action');

  await db
    .update(orders)
    .set({
      status,
      deliveredAt: status === 'delivered' ? new Date().toISOString() : undefined
    })
    .where(eq(orders.id, orderId))
    .execute();

  res.json({ order });
};
