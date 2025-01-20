import { selectUserSchema } from '@/db/users.schema';
import { queryUsersSchema, updateProfileSchema, verifyUserAccountSchema } from '@/dtos/users.dto';
import { z } from 'zod';
import { ZodOpenApiPathsObject } from 'zod-openapi';
import 'zod-openapi/extend';

const tags = ['User'];
export const usersDoc: ZodOpenApiPathsObject = {
  '/api/users/profile': {
    get: {
      tags,
      summary: 'Fetch profile',
      responses: {
        200: {
          description: 'User profile fetched successfully',
          content: { 'application/json': { schema: z.object({ user: selectUserSchema }) } }
        },
        401: {
          description: 'User is not authenticated'
        }
      }
    },
    put: {
      tags,
      summary: 'Update Profile',
      requestBody: {
        content: {
          'application/json': {
            schema: updateProfileSchema.openapi({
              example: {}
            })
          }
        }
      },
      responses: {
        200: {
          description: 'Profile updated successfully',
          content: { 'application/json': { schema: z.object({ user: selectUserSchema }) } }
        },
        400: { description: 'Invalid request body payload' },
        401: { description: 'User is not authenticated' }
      }
    }
  },
  '/api/users/{id}': {
    get: {
      tags,
      summary: 'Get user details',
      requestParams: {
        path: z.object({ id: z.string() }).openapi({ description: 'User id' })
      },
      responses: {
        200: {
          description: 'User details fetched successfully',
          content: { 'application/json': { schema: z.object({ user: selectUserSchema }) } }
        }
      }
    }
  },
  '/api/users': {
    get: {
      tags,
      summary: 'Search users',
      description: 'Search users by name or email with cursor',
      requestParams: {
        query: queryUsersSchema
      },
      responses: {
        200: {
          description: 'Search results fetched successfully',
          content: {
            'application/json': { schema: z.object({ users: z.array(selectUserSchema) }) }
          }
        },
        400: {
          description: 'Invalid request query'
        }
      }
    }
  },
  '/api/users/otp/request': {
    post: {
      tags,
      summary: 'Request verification otp',
      responses: {
        200: { description: 'Otp sent to mail successsfully' },
        400: { description: 'User is already verified' },
        401: { description: 'User is not authorized' }
      }
    }
  },
  '/api/users/otp/verify': {
    post: {
      tags,
      summary: 'Verify account from otp',
      requestBody: { content: { 'application/json': { schema: verifyUserAccountSchema } } },
      responses: {
        200: { description: 'User account verified successfully' },
        400: { description: 'User is already verified or otp is invalid' },
        401: { description: 'User is not authorized' }
      }
    }
  }
};
