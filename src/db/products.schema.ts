import { createId } from '@paralleldrive/cuid2';
import { getTableColumns } from 'drizzle-orm';
import { index, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { responseUserSchema } from './users.schema';

export const products = pgTable(
  'products',
  (t) => ({
    id: t.text('id').notNull().$defaultFn(createId),
    title: t.varchar('title', { length: 200 }).notNull(),
    image: t.varchar('image', { length: 200 }),
    category: t.varchar('category', { enum: ['fruits', 'vegetables'] }).notNull(),
    description: t.text('description'),
    stock: t.integer('stock').notNull().default(1),
    ownerId: t.text('owner_id').notNull(),
    price: t.integer('price').notNull().default(0),
    discount: t.integer('discount').notNull().default(0),
    createdAt: t
      .timestamp('created_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow()
  }),
  (products) => [
    primaryKey({ name: 'products_pkey', columns: [products.id] }),
    index('idx_user_id_products').on(products.ownerId)
  ]
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const selectProductSnapshot = getTableColumns(products);
export const selectProductSchema = createSelectSchema(products);
export const responseProductSchema = selectProductSchema.extend({
  owner: responseUserSchema
});
export type ResponseProduct = z.infer<typeof responseProductSchema>;
