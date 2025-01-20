import { z } from 'zod';
import { imageSchema } from './common.dto';

export const loginUserSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email')
    .max(40, 'Too long email'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(20, "Passwords can't exceed 20 characters")
});

export const registerUserSchema = loginUserSchema.extend({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(4, 'Too short name')
    .max(30, 'Too long name')
    .transform((val) => val.split(' ').slice(0, 3).join(' ')),
  phone: z
    .number()
    .refine((phone) => phone.toString().length === 10, 'Invalid phone number')
    .optional(),
  image: imageSchema.optional()
});

export const requestOtpLoginSchema = z.object({ email: z.string().email() });
export const loginWithOtpSchema = z.object({
  otp: z.string().length(6, 'Invalid otp'),
  email: z.string().email()
});

export const updatePasswordSchema = z.object({
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(20, "Passwords can't exceed 20 characters")
});
