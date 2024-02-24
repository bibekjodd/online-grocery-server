import z from 'zod';
import { imageSchema } from './common.dto';

const nameSchema = z
  .string()
  .min(4, 'Name must be at least 4 characters')
  .max(30, 'Name must not exceed 30 characters');
const emailSchema = z
  .string()
  .email()
  .max(40, 'Email must not exceed 40 characters');
const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(20, 'Password must not exceed 20 characters');

export const registerUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
});

export const loginUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    image: imageSchema.nullish()
  })
  .refine((data) => {
    if (!data.name && !data.image) return false;
    return true;
  }, 'At least one of name or image is required to update profile');
