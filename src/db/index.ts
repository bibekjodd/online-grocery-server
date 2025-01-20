import { env } from '@/config/env.config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client);
