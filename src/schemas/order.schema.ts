import { createId } from '@paralleldrive/cuid2';
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';
import { products } from './product.schema';
import { users } from './user.schema';

export const orders = pgTable(
  'orders',
  {
    id: text('id').notNull().$defaultFn(createId),
    productId: text('product_id').notNull(),
    sellerId: text('seller_id').notNull(),
    userId: text('user_id').notNull(),
    address: text('address').notNull(),
    status: varchar('status', {
      enum: ['processing', 'delivered', 'cancelled']
    })
      .notNull()
      .default('processing'),
    paid: boolean('paid').notNull().default(false),
    paymentType: varchar('payment_type', {
      enum: ['cash-on-delivery', 'online']
    }).notNull(),
    price: integer('price').notNull(),
    quantity: integer('quantity').notNull(),
    totalPrice: integer('total_price').notNull(),
    orderedAt: timestamp('ordered_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow(),
    estimatedDeliveryDate: timestamp('estimated_delivery_date', {
      mode: 'string',
      withTimezone: true
    }).notNull(),
    deliveredAt: timestamp('delivered_at', {
      mode: 'string',
      withTimezone: true
    })
  },
  function constraints(orders) {
    return {
      primaryKey: primaryKey({ name: 'orders_pkey', columns: [orders.id] }),
      sellerReference: foreignKey({
        name: 'fk_seller_id',
        columns: [orders.sellerId],
        foreignColumns: [users.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      userReference: foreignKey({
        name: 'fk_user_id',
        columns: [orders.userId],
        foreignColumns: [users.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),
      prodctReference: foreignKey({
        name: 'fk_product_id',
        columns: [orders.productId],
        foreignColumns: [products.id]
      })
        .onDelete('cascade')
        .onUpdate('cascade'),

      indexSeller: index('orders_idx_seller_id').on(orders.sellerId),
      indexUser: index('orders_idx_user_id').on(orders.userId),
      indexProduct: index('orders_idx_product_id').on(orders.productId)
    };
  }
);

export const selectOrderSnapshot = {
  id: orders.id,
  productId: orders.productId,
  sellerId: orders.sellerId,
  userId: orders.userId,
  address: orders.address,
  status: orders.status,
  paid: orders.paid,
  paymentType: orders.paymentType,
  price: orders.price,
  quantity: orders.quantity,
  totalPrice: orders.totalPrice,
  orderedAt: orders.orderedAt,
  estimatedDeliveryDate: orders.estimatedDeliveryDate,
  deliveredAt: orders.deliveredAt
};
