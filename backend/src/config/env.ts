import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().min(1).default('15m'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(16, 'REFRESH_TOKEN_SECRET must be at least 16 characters'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1).default('7d'),
  FRONTEND_ORIGIN: z.string().url().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors
  );

  process.exit(1);
}

export const env = parsedEnv.data;