import { env } from '@/config/env.config';
import Stripe from 'stripe';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);
