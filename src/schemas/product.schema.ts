import { createId } from '@paralleldrive/cuid2';
import {
  index,
  integer,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core';

export const products = pgTable(
  'products',
  {
    id: text('id').notNull().$defaultFn(createId),
    title: varchar('title', { length: 200 }).notNull(),
    image: varchar('image', { length: 200 }),
    category: varchar('category', { enum: ['fruits', 'vegetables'] }).notNull(),
    description: json('json').$type<string[]>(),
    stock: integer('stock').notNull().default(1),
    ownerId: text('owner_id').notNull(),
    price: integer('price').notNull().default(0),
    discount: integer('discount').notNull().default(0),
    listedAt: timestamp('listed_at', { mode: 'string', withTimezone: true })
      .notNull()
      .defaultNow()
  },
  function constraints(products) {
    return {
      primaryKey: primaryKey({ name: 'products_pkey', columns: [products.id] }),
      usersIndex: index('products_idx_user_id').on(products.ownerId)
    };
  }
);

export const selectProductSnapshot = {
  id: products.id,
  title: products.title,
  category: products.category,
  description: products.description,
  stock: products.stock,
  ownerId: products.ownerId,
  price: products.price,
  discount: products.discount,
  listedAt: products.listedAt
};
