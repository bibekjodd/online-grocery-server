import {
  boolean,
  date,
  foreignKey,
  integer,
  pgTable,
  text
} from 'drizzle-orm/pg-core';
import { products } from './product.schema';
import { users } from './user.schema';

export const sales = pgTable(
  'sales',
  {
    userId: text('user_id'),
    productId: text('product_id'),
    quantity: integer('quantity').notNull(),
    amount: integer('amount').notNull(),
    soldDate: date('sold_date', { mode: 'string' }).notNull().defaultNow(),
    deliveryDays: integer('delivery_days').notNull(),
    isCancelled: boolean('is_cancelled').notNull().default(false)
  },
  function constraints(sales) {
    return {
      userReference: foreignKey({
        name: 'fk_user_id',
        columns: [sales.userId],
        foreignColumns: [users.id]
      })
        .onDelete('set null')
        .onUpdate('cascade'),
      productReference: foreignKey({
        name: 'fk_product_id',
        columns: [sales.productId],
        foreignColumns: [products.id]
      })
        .onDelete('set null')
        .onUpdate('cascade')
    };
  }
);
export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;
