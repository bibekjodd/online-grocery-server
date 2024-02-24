import { db } from '@/config/database';
import {
  createProductSchema,
  queryProductsSchema,
  updateProductSchema
} from '@/dtos/product.dto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException
} from '@/lib/exceptions';
import { handleAsync } from '@/middlewares/handle-async';
import { products, selectProductSnapshot } from '@/schemas/product.schema';
import { selectUserSnapshot, users } from '@/schemas/user.schema';
import { and, asc, desc, eq, gte, ilike, lte } from 'drizzle-orm';

export const createProduct = handleAsync(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  // limit unverified users
  if (!req.user.isVerified) {
    const totalProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.ownerId, req.user.id));
    if (totalProducts.length >= 10) {
      throw new ForbiddenException(
        'Unverified sellers are not allowed to list more than 10 products'
      );
    }
  }

  const data = createProductSchema.parse(req.body);
  const [result] = await db
    .insert(products)
    .values({ ...data, ownerId: req.user.id })
    .returning();

  if (!result)
    throw new BadRequestException('Could not list product at the moment');
  return res.status(201).json({
    product: {
      ...result,
      owner: req.user
    }
  });
});

export const getProductDetails = handleAsync<{ id: string }>(
  async (req, res) => {
    const productId = req.params.id;
    const [product] = await db
      .select({
        ...selectProductSnapshot,
        owner: selectUserSnapshot
      })
      .from(products)
      .where(eq(products.id, productId))
      .leftJoin(users, eq(products.ownerId, users.id));

    if (!product) throw new NotFoundException('Product does not exist');

    return res.json({ product });
  }
);

export const updateProduct = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const productId = req.params.id;
  const data = updateProductSchema.parse(req.body);
  const [result] = await db
    .update(products)
    .set(data)
    .where(and(eq(products.id, productId), eq(products.ownerId, req.user.id)))
    .returning();

  if (!result) {
    throw new BadRequestException(
      'Product does not exist or you are not the owner of the product'
    );
  }

  return res.json({ product: { ...result, owner: req.user } });
});

export const deleteProduct = handleAsync<{ id: string }>(async (req, res) => {
  if (!req.user) throw new UnauthorizedException();

  const productId = req.params.id;
  const [result] = await db
    .delete(products)
    .where(and(eq(products.id, productId), eq(products.ownerId, req.user.id)))
    .returning({ id: products.id });

  if (!result)
    throw new BadRequestException(
      'Product already deleted or you are not allowed to delete this product'
    );

  return res.json({ message: 'Product deleted successfully' });
});

export const queryProducts = handleAsync(async (req, res) => {
  const {
    q,
    limit,
    page,
    price_gte,
    price_lte,
    category,
    orderby,
    owner,
    verified_seller
  } = queryProductsSchema.parse(req.query);
  const offset = (page - 1) * limit;
  const sqlOrderby = [];
  if (orderby === 'price_asc') sqlOrderby.push(asc(products.price));
  if (orderby === 'price_desc') sqlOrderby.push(desc(products.price));

  const result = await db
    .select({ ...selectProductSnapshot, owner: selectUserSnapshot })
    .from(products)
    .where(
      and(
        q ? ilike(products.title, `%${q}%`) : undefined,
        price_gte ? gte(products.price, price_gte) : undefined,
        price_lte ? lte(products.price, price_lte) : undefined,
        category ? eq(products.category, category) : undefined,
        owner ? eq(products.ownerId, owner) : undefined
      )
    )
    .innerJoin(
      users,
      and(
        eq(products.ownerId, users.id),
        verified_seller ? eq(users.isVerified, true) : undefined
      )
    )
    .limit(limit)
    .offset(offset)
    .groupBy(products.id, users.id)
    .orderBy(...sqlOrderby);

  return res.json({ total: result.length, products: result });
});
