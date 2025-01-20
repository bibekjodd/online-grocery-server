import { env } from '@/config/env.config';
import { db } from '@/db';
import { InsertOrder, orders } from '@/db/orders.schema';
import { products } from '@/db/products.schema';
import { BadRequestException, HttpException } from '@/lib/exceptions';
import { stripe } from '@/lib/stripe';
import { eq, sql } from 'drizzle-orm';
import { RequestHandler } from 'express';
import { CheckoutMetadata } from './products.controller';

export const webhookController: RequestHandler = async (req, res) => {
  if (!(req.body instanceof Buffer || typeof req.body === 'string'))
    throw new BadRequestException('Invalid body provided');

  const stripeSignature = req.headers['stripe-signature'];
  if (!stripeSignature) throw new BadRequestException('Invalid stripe signature');

  const event = await stripe.webhooks.constructEventAsync(
    req.body,
    stripeSignature,
    env.STRIPE_SECRET_WEBHOOK_KEY
  );

  if (event.type !== 'checkout.session.completed')
    throw new HttpException('Method is not implemented', 501);

  const metadata = event.data.object.metadata as CheckoutMetadata;

  const orderItems = JSON.parse(metadata.orderItems) as InsertOrder[];

  const updateProductsPromise: Promise<unknown>[] = [];
  const updateOrdersPromise: Promise<unknown> = db.insert(orders).values(orderItems).execute();
  for (const order of orderItems) {
    updateProductsPromise.push(
      db
        .update(products)
        .set({ stock: sql`${products.stock}-${order.quantity}` })
        .where(eq(orders.id, order.productId))
        .execute()
    );
  }

  await Promise.all([...updateProductsPromise, updateOrdersPromise]);

  res.json({ message: 'Order placed successfully' });
};
