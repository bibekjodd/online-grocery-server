import { responseProductSchema } from '@/db/products.schema';
import {
  checkoutProductSchema,
  createProductSchema,
  queryProductsSchema,
  updateProductSchema
} from '@/dtos/products.dto';
import { z } from 'zod';
import { ZodOpenApiPathsObject } from 'zod-openapi';

const tags = ['Product'];
export const productsDoc: ZodOpenApiPathsObject = {
  '/api/products': {
    post: {
      tags,
      summary: 'Register a new product',
      requestBody: {
        content: { 'application/json': { schema: createProductSchema } }
      },
      responses: {
        201: {
          description: 'New product added successfully',
          content: { 'application/json': { schema: responseProductSchema } }
        },
        400: {
          description:
            'Invalid product details given or user is admin or user is unverified and has crossed the max products limit'
        },
        401: { description: 'User is not authorized' }
      }
    },
    get: {
      tags,
      summary: 'Fetch products list',
      requestParams: { query: queryProductsSchema },
      responses: {
        200: {
          description: 'Products list fetched successfully',
          content: {
            'application/json': {
              schema: z.object({
                cursor: z.string().optional(),
                products: z.array(responseProductSchema)
              })
            }
          }
        },
        400: { description: 'Invalid query params' },
        401: { description: 'User must be authorized while requesting the resource of self' }
      }
    }
  },
  '/api/products/{id}': {
    get: {
      tags,
      summary: 'Get product details',
      requestParams: { path: z.object({ id: z.string() }) },
      requestBody: { content: { 'application/json': { schema: updateProductSchema } } },
      responses: {
        200: {
          description: 'Product details fetched successfully',
          content: { 'application/json': { schema: z.object({ product: responseProductSchema }) } }
        },
        404: { description: 'Product does not exit' }
      }
    },
    put: {
      tags,
      summary: 'Update product details',
      requestParams: { path: z.object({ id: z.string() }) },
      requestBody: { content: { 'application/json': { schema: updateProductSchema } } },
      responses: {
        200: {
          description: 'Product details updated successfully',
          content: { 'application/json': { schema: z.object({ product: responseProductSchema }) } }
        },
        400: { description: 'Invalid update details' },
        401: { description: 'User is not authorized ' },
        403: { description: 'User must be owner of admin to update product' },
        404: { description: 'Product does not exit' }
      }
    }
  },
  '/api/products/checkout': {
    post: {
      tags,
      summary: 'Checkout products',
      requestBody: { content: { 'application/json': { schema: checkoutProductSchema } } },
      responses: {
        200: {
          description: 'Products ready ready to checkout',
          content: { 'application/json': { schema: z.object({ checkoutSessionId: z.string() }) } }
        }
      }
    }
  }
};
