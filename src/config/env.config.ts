import { config } from 'dotenv';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z
      .union([z.string(), z.number()])
      .default(5000)
      .transform((port) => {
        port = Number(port) || 5000;
        let indexOfPort = process.argv.indexOf('-p');
        if (indexOfPort === -1) {
          indexOfPort = process.argv.indexOf('--port');
        }
        if (indexOfPort === -1) return port;
        port = Number(process.argv[indexOfPort + 1]) || 5000;
        return port;
      }),
    FRONTEND_URLS: z
      .string()
      .optional()
      .transform((urls) => (urls || '').split(' ')),

    DATABASE_URL: z.string(),
    SESSION_SECRET: z.string(),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_CALLBACK_URL: z.string(),

    SMTP_PASS: z.string(),
    SMTP_MAIL: z.string(),
    SMTP_SERVICE: z.string(),

    STRIPE_SECRET_KEY: z.string(),
    STRIPE_SECRET_WEBHOOK_KEY: z.string()
  })
  .readonly();

export const validateEnv = () => {
  if (process.env.NODE_ENV !== 'production') {
    config({ path: '.env' });
  }
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof Error) console.log(error.message);
    console.log(`Environment variables validation failed\nExitting app`.red);
    process.exit(1);
  }
};
export const env = validateEnv();
export type EnvType = z.infer<typeof envSchema>;
