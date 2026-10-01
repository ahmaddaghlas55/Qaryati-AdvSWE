import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().min(1),
  JWT_REFRESH_TTL: z.string().min(1),
  CORS_ORIGINS: z.string().min(1),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive(),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
  GEOCODING_PROVIDER: z.string().min(1),
  GEOCODING_BASE_URL: z.string().url(),
  GEOCODING_USER_AGENT: z.string().min(1),
  GEOCODING_TIMEOUT_MS: z.coerce.number().int().positive(),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive(),
  ADMIN_BOOTSTRAP_EMAIL: z.string().email(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
});

export type Environment = z.infer<typeof envSchema>;
