import { responseOrderSchema } from '@/db/orders.schema';
import { queryOrdersSchema, updateOrderStatusSchema } from '@/dtos/orders.dto';
import { z } from 'zod';
import { ZodOpenApiPathsObject } from 'zod-openapi';

const tags = ['Order'];

export const ordersDoc: ZodOpenApiPathsObject = {
  '/api/orders': {
    get: {
      tags,
      summary: 'Fetch orders list',
      requestParams: { query: queryOrdersSchema },
      responses: {
        200: {
          description: 'Orders list fetched successfully',
          content: {
            'application/json': {
              schema: z.object({
                cursor: z.string().optional(),
                orders: z.array(responseOrderSchema)
              })
            }
          }
        },
        400: { description: 'Invalid query params' },
        401: { description: 'User is not authorized' },
        403: { description: 'Not allowed to access unavailable resources' }
      }
    }
  },
  '/api/orders/{id}': {
    get: {
      tags,
      summary: 'Get order details',
      requestParams: { path: z.object({ id: z.string().describe('Order id') }) },
      responses: {
        200: {
          description: 'Orders details fetched successfully',
          content: { 'application/json': { schema: z.object({ order: responseOrderSchema }) } }
        },
        401: { description: 'User is not authorized' },
        403: { description: 'Order does not belong to user' },
        404: { description: 'Order does not exist' }
      }
    }
  },
  '/api/orders/{id}/status': {
    put: {
      tags,
      summary: 'Update order status',
      requestParams: { path: z.object({ id: z.string().describe('Order id') }) },
      requestBody: { content: { 'application/json': { schema: updateOrderStatusSchema } } },
      responses: {
        200: {
          description: 'Order status updated to delivered successfully',
          content: { 'application/json': { schema: z.object({ order: responseOrderSchema }) } }
        },
        400: { description: 'Invalid request body' },
        401: { description: 'User is not authorized' },
        403: { description: 'Order does not belong to user to perform this action' },
        404: { description: 'Order does not exist' }
      }
    }
  }
};
