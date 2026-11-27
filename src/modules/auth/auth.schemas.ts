import { z } from 'zod';

const refreshTokenSchema = z.string().min(32).max(512);

export const adminBootstrapCredentialsSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).refine((password) => Buffer.byteLength(password, 'utf8') <= 72, {
    message: 'Password must be at most 72 bytes',
  }),
});

export const userRoleParamsSchema = z.object({
  id: z.string()
    .regex(/^[1-9]\d{0,18}$/)
    .refine((id) => /^[1-9]\d{0,18}$/.test(id) && BigInt(id) <= 9223372036854775807n),
});

export const userRoleBodySchema = z.object({
  role: z.enum(['contributor', 'verifier', 'admin']),
});

export const loginBodySchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).refine((password) => Buffer.byteLength(password, 'utf8') <= 72, {
    message: 'Password must be at most 72 bytes',
  }),
});

export const refreshBodySchema = z.object({ refreshToken: refreshTokenSchema });

export const logoutBodySchema = z.object({ refreshToken: refreshTokenSchema });