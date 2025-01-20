import { responseReviewSchema } from '@/db/reviews.schema';
import { postReviewSchema, queryReviewsSchema } from '@/dtos/reviews.dto';
import { z } from 'zod';
import { ZodOpenApiPathsObject } from 'zod-openapi';
import 'zod-openapi/extend';

const tags = ['Review'];

export const reviewsDoc: ZodOpenApiPathsObject = {
  '/api/reviews': {
    post: {
      tags,
      summary: 'Post a review',
      requestParams: { path: z.object({ id: z.string().describe('Product id') }) },
      requestBody: { content: { 'application/json': { schema: postReviewSchema } } },
      responses: {
        201: {
          description: 'Review posted successfully',
          content: { 'application/json': { schema: z.object({ review: responseReviewSchema }) } }
        },
        400: { description: 'Invalid review details provided or review is already posted' },
        401: { description: 'User is nnot authorized' }
      }
    },
    get: {
      tags,
      summary: 'Fetch reviews list',
      requestParams: {
        path: z.object({ id: z.string().describe('Product id') }),
        query: queryReviewsSchema
      },
      responses: {
        200: {
          description: 'Reviews list fetched successfully',
          content: {
            'application/json': {
              schema: z.object({
                cursor: z.string().optional(),
                reviews: z.array(responseReviewSchema)
              })
            }
          }
        }
      }
    },
    delete: {
      tags,
      summary: 'Delete review',
      requestParams: { path: z.object({ id: z.string().describe('Review id') }) },
      responses: {
        200: { description: 'Review deleted successfully' },
        401: { description: 'User is not authorized' },
        404: { description: 'Review does not exist' }
      }
    }
  }
};
