import { selectUserSchema } from '@/db/users.schema';
import {
  loginUserSchema,
  loginWithOtpSchema,
  registerUserSchema,
  requestOtpLoginSchema,
  updatePasswordSchema
} from '@/dtos/auth.dto';
import { z } from 'zod';
import { ZodOpenApiPathsObject } from 'zod-openapi';

const tags = ['Auth'];

export const authDoc: ZodOpenApiPathsObject = {
  '/api/auth/register': {
    post: {
      tags,
      summary: 'Register with credentials',
      requestBody: { content: { 'application/json': { schema: registerUserSchema } } },
      responses: {
        201: {
          description: 'Registered account successfully',
          content: {
            'application/json': {
              schema: z.object({ user: selectUserSchema.omit({ password: true }) })
            }
          }
        },
        400: { description: 'Invalid register data or user with same email already exists' }
      }
    }
  },
  '/api/auth/login': {
    post: {
      tags,
      summary: 'Login with credentials',
      requestBody: { content: { 'application/json': { schema: loginUserSchema } } },
      responses: {
        200: {
          description: 'Logged in successfully',
          content: {
            'application/json': {
              schema: z.object({ user: selectUserSchema.omit({ password: true }) })
            }
          }
        },
        400: { description: 'Invalid login credentials' }
      }
    }
  },
  '/api/auth/login/google': {
    get: {
      tags,
      summary: 'Login with google',
      description: 'User the authorize button above for login',
      responses: {
        302: { description: 'Redirect to Google for authentication' },
        401: { description: 'Authentication failed' }
      }
    }
  },
  '/api/auth/logout': {
    post: {
      tags,
      summary: 'Logout',
      responses: {
        200: { description: 'Logged out successfully' },
        401: { description: 'Unauthorized - Already logged out' }
      }
    }
  },
  '/api/auth/password': {
    put: {
      tags,
      summary: 'Update password',
      requestBody: { content: { 'application/json': { schema: updatePasswordSchema } } },
      responses: {
        200: { description: 'Password updated successfully' },
        400: { description: 'Invalid password provided or user is logged from social account' },
        401: { description: 'User is not authorized' }
      }
    }
  },
  '/api/auth/otp/request': {
    post: {
      tags,
      summary: 'Request login otp',
      requestBody: { content: { 'application/json': { schema: requestOtpLoginSchema } } },
      responses: {
        200: { description: 'Login otp sent to mail successfully' },
        400: { description: 'Invalid email or user does not use credentials auth' }
      }
    }
  },
  '/api/auth/otp/verify': {
    post: {
      tags,
      summary: 'Login with otp',
      requestBody: { content: { 'application/json': { schema: loginWithOtpSchema } } },
      responses: {
        200: {
          description: 'Logged in successfully',
          content: { 'application/json': { schema: z.object({ user: selectUserSchema }) } }
        },
        400: { description: 'Invalid otp or otp is expired' }
      }
    }
  }
};
