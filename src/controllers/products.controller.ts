import { db } from '@/db';
import { InsertOrder } from '@/db/orders.schema';
import { products, ResponseProduct, selectProductSnapshot } from '@/db/products.schema';
import { selectUserSnapshot, users } from '@/db/users.schema';
import {
  checkoutProductSchema,
  createProductSchema,
  queryProductsSchema,
  updateProductSchema
} from '@/dtos/products.dto';
import { MILLIS } from '@/lib/constants';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerException,
  NotFoundException,
  UnauthorizedException
} from '@/lib/exceptions';
import { stripe } from '@/lib/stripe';
import { encodeCursor } from '@/lib/utils';
import { and, asc, desc, eq, getTableColumns, gt, ilike, inArray, lt, or, SQL } from 'drizzle-orm';
import { RequestHandler } from 'express';
import Stripe from 'stripe';

export const createProduct: RequestHandler<unknown, { product: ResponseProduct }> = async (
  req,
  res
) => {
  if (!req.user) throw new UnauthorizedException();
  if (req.user.role === 'admin') throw new BadRequestException("Admins can't add product");

  // limit unverified users
  if (!req.user.isVerified) {
    const totalProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.ownerId, req.user.id))
      .execute()
      .then((result) => result.length);
    if (totalProducts >= 10) {
      throw new BadRequestException(
        'Unverified sellers are not allowed to list more than 10 products'
      );
    }
  }

  const data = createProductSchema.parse(req.body);
  const [result] = await db
    .insert(products)
    .values({ ...data, ownerId: req.user.id })
    .returning();

  if (!result) throw new InternalServerException();

  const responseProduct: ResponseProduct = { ...result, owner: req.user };
  res.status(201).json({ product: responseProduct });
};

export const getProductDetails: RequestHandler<
  { id: string },
  { product: ResponseProduct }
> = async (req, res) => {
  const productId = req.params.id;
  const [product] = await db
    .select({
      ...selectProductSnapshot,
      owner: getTableColumns(users)
    })
    .from(products)
    .innerJoin(users, eq(products.ownerId, users.id))
    .where(eq(products.id, productId));

  if (!product) throw new NotFoundException('Product does not exist');

  res.json({ product });
};

export const updateProduct: RequestHandler<{ id: string }, { product: ResponseProduct }> = async (
  req,
  res
) => {
  if (!req.user) throw new UnauthorizedException();

  const productId = req.params.id;
  const data = updateProductSchema.parse(req.body);
  const [product] = await db
    .select({ ownerId: products.ownerId })
    .from(products)
    .where(eq(products.id, productId));
  if (!product) throw new NotFoundException('Product does not exist');

  if (!(req.user.role === 'admin' || req.user.id == product.ownerId))
    throw new ForbiddenException('User must be owner of admin to update product');

  const [updatedProduct] = await db
    .update(products)
    .set(data)
    .where(eq(products.id, productId))
    .returning();

  if (!updatedProduct) throw new InternalServerException();

  const responseProduct: ResponseProduct = { ...updatedProduct, owner: req.user };
  res.json({ product: responseProduct });
};

export const queryProducts: RequestHandler<
  unknown,
  { cursor: string | undefined; products: ResponseProduct[] }
> = async (req, res) => {
  const query = queryProductsSchema.parse(req.query);
  if (query.resource === 'self' && !req.user) throw new UnauthorizedException();

  if (query.resource === 'self') query.owner = req.user?.id;

  let cursorCondition: SQL<unknown> | undefined = undefined;
  if ((query.sort === 'recent' || !query.sort) && query.cursor) {
    cursorCondition = or(
      lt(products.createdAt, query.cursor.value),
      and(eq(products.createdAt, query.cursor.value), lt(products.id, query.cursor.id))
    );
  }
  if (query.sort === 'oldest' && query.cursor)
    cursorCondition = or(
      gt(products.createdAt, query.cursor.value),
      and(eq(products.createdAt, query.cursor.value), gt(products.id, query.cursor.id))
    );
  if (query.sort === 'title_desc' && query.cursor)
    cursorCondition = or(
      lt(products.title, query.cursor.value),
      and(eq(products.title, query.cursor.value), lt(products.id, query.cursor.id))
    );
  if (query.sort === 'title_asc' && query.cursor)
    cursorCondition = or(
      gt(products.title, query.cursor.value),
      and(eq(products.title, query.cursor.value), gt(products.id, query.cursor.id))
    );
  if (query.sort === 'price_desc' && query.cursor)
    cursorCondition = or(
      lt(products.price, Number(query.cursor.value)),
      and(eq(products.price, Number(query.cursor.value)), lt(products.id, query.cursor.id))
    );
  if (query.sort === 'price_asc' && query.cursor)
    cursorCondition = or(
      gt(products.price, Number(query.cursor.value)),
      and(eq(products.price, Number(query.cursor.value)), gt(products.id, query.cursor.id))
    );

  const result = await db
    .select({ ...selectProductSnapshot, owner: selectUserSnapshot })
    .from(products)
    .where(
      and(
        query.q ? ilike(products.title, `%${query.q}%`) : undefined,
        cursorCondition,
        query.owner ? eq(products.ownerId, query.owner) : undefined,
        query.category ? eq(products.category, query.category) : undefined
      )
    )
    .innerJoin(users, eq(products.ownerId, users.id))
    .limit(query.limit)
    .orderBy((t) => {
      if (query.sort === 'price_asc') return [asc(t.price), asc(t.id)];
      if (query.sort === 'price_desc') return [desc(t.price), desc(t.id)];
      if (query.sort === 'title_asc') return [asc(t.title), asc(t.id)];
      if (query.sort === 'title_desc') return [desc(t.title), desc(t.id)];
      if (query.sort === 'oldest') return [asc(t.createdAt), asc(t.id)];
      return [desc(t.createdAt), desc(t.id)];
    })
    .groupBy(products.id, users.id);

  let cursor: string | undefined = undefined;
  const lastResult = result.at(result.length - 1);
  if (lastResult) {
    let cursorValue: unknown = lastResult.createdAt;
    if (query.sort === 'oldest' || query.sort === 'recent' || !query.sort)
      cursorValue = lastResult.createdAt;
    if (query.sort === 'price_asc' || query.sort === 'price_desc') cursorValue = lastResult.price;
    if (query.sort === 'title_asc' || query.sort === 'title_desc') cursorValue = lastResult.title;
    cursor = encodeCursor({ value: cursorValue, id: lastResult.id });
  }
  res.json({ cursor, products: result });
};

export type CheckoutMetadata = {
  userId: string;
  orderItems: string;
};
export const checkoutProducts: RequestHandler<unknown, { checkoutSessionId: string }> = async (
  req,
  res
) => {
  if (!req.user) throw new UnauthorizedException();
  if (req.user.role === 'admin')
    throw new BadRequestException('Admins are not allowed to checkout');

  const { products: checkoutItems, successUrl, cancelUrl } = checkoutProductSchema.parse(req.body);

  const checkoutItemsIds = checkoutItems.map((product) => product.id);

  const resultProducts = await db
    .select()
    .from(products)
    .where(inArray(products.id, checkoutItemsIds));

  const orderItems: InsertOrder[] = [];
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const product of checkoutItems) {
    const currentProduct = resultProducts.find((item) => item.id === product.id);
    if (!currentProduct)
      throw new NotFoundException('Some of the requested products does not exist');
    if (currentProduct.stock < product.quantity)
      throw new BadRequestException(
        `Product: ${currentProduct.title} has insufficient stocks to checkout`
      );

    orderItems.push({
      address: req.user.address || '',
      amount:
        (currentProduct.price - (currentProduct.price * currentProduct.discount) / 100) *
        product.quantity,
      customerId: req.user.id,
      sellerId: currentProduct.ownerId,
      estimatedDeliveryDate: new Date(Date.now() + MILLIS.DAY * 7).toISOString(),
      productId: currentProduct.id,
      quantity: product.quantity,
      unitPrice: currentProduct.price - (currentProduct.price * currentProduct.discount) / 100
    });

    lineItems.push({
      quantity: product.quantity,
      price_data: {
        unit_amount:
          (currentProduct.price - (currentProduct.price * currentProduct.discount) / 100) * 100,
        currency: 'npr',
        product_data: {
          name: currentProduct.title,
          description: currentProduct.description || undefined,
          images: currentProduct.image ? [currentProduct.image] : undefined
        }
      }
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    metadata: {
      userId: req.user.id,
      orderItems: JSON.stringify(orderItems)
    } satisfies CheckoutMetadata,
    customer_email: req.user.email,
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    mode: 'payment'
  });

  res.json({ checkoutSessionId: checkoutSession.id });
};
