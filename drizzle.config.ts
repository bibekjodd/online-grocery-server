import { type Config } from 'drizzle-kit';
import { env } from './src/config/env.config';

export default {
  schema: './src/db/*.schema.ts',
  dialect: 'postgresql',
  casing: 'snake_case',
  dbCredentials: {
    url: env.DATABASE_URL
  }
} satisfies Config;
