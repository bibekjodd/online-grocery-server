import { createId } from '@paralleldrive/cuid2';
import { getTableColumns } from 'drizzle-orm';
import { foreignKey, index, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { products } from './products.schema';
import { users } from './users.schema';

export const orders = pgTable(
  'orders',
  (t) => ({
    id: t.text('id').notNull().$defaultFn(createId),
    productId: t.text('product_id').notNull(),
    sellerId: t.text('seller_id').notNull(),
    customerId: t.text('customer_id').notNull(),
    address: t.text('address').notNull(),
    status: t
      .varchar('status', {
        enum: ['pending', 'delivered', 'cancelled']
      })
      .notNull()
      .default('pending'),
    unitPrice: t.integer('unit_price').notNull(),
    quantity: t.integer('quantity').notNull(),
    amount: t.integer('amount').notNull(),
    orderedAt: t
      .timestamp('ordered_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    estimatedDeliveryDate: t
      .timestamp('estimated_delivery_date', {
        mode: 'string',
        withTimezone: true
      })
      .notNull(),
    deliveredAt: t.timestamp('delivered_at', {
      mode: 'string',
      withTimezone: true
    })
  }),
  (orders) => [
    primaryKey({ name: 'orders_pkey', columns: [orders.id] }),
    foreignKey({
      name: 'fk_seller_id',
      columns: [orders.sellerId],
      foreignColumns: [users.id]
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      name: 'fk_user_id',
      columns: [orders.customerId],
      foreignColumns: [users.id]
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    foreignKey({
      name: 'fk_product_id',
      columns: [orders.productId],
      foreignColumns: [products.id]
    })
      .onDelete('cascade')
      .onUpdate('cascade'),

    index('idx_seller_id_orders').on(orders.sellerId),
    index('idx_customer_id_orders').on(orders.customerId),
    index('idx_product_id_orders').on(orders.productId)
  ]
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export const selectOrderSnapshot = getTableColumns(orders);

export const selectOrderSchema = createSelectSchema(orders);
export const responseOrderSchema = selectOrderSchema.extend({});
export type ResponseOrder = z.infer<typeof responseOrderSchema>;
