import { createHash, randomBytes } from 'node:crypto';

import bcrypt from 'bcrypt';
import jwt, { type JwtPayload } from 'jsonwebtoken';

export interface AuthCrypto {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, passwordHash: string): Promise<boolean>;
  createAccessToken(userId: string): string;
  verifyAccessToken(token: string): string | null;
  createRefreshToken(): string;
  hashRefreshToken(token: string): string;
}

export function createAuthCrypto(jwtSecret: string): AuthCrypto {
  return {
    hashPassword: (password) => bcrypt.hash(password, 12),
    verifyPassword: (password, passwordHash) => bcrypt.compare(password, passwordHash),
    createAccessToken: (userId) => jwt.sign({}, jwtSecret, {
      subject: userId,
      algorithm: 'HS256',
      expiresIn: '15m',
    }),
    verifyAccessToken: (token) => {
      try {
        const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
        if (typeof payload !== 'object' || payload === null) return null;
        if (typeof payload.sub !== 'string' || payload.sub.length === 0) return null;
        if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') return null;
        if (!Number.isSafeInteger(payload.iat) || !Number.isSafeInteger(payload.exp)) return null;
        if (payload.exp - payload.iat !== 15 * 60) return null;
        return payload.sub;
      } catch {
        return null;
      }
    },
    createRefreshToken: () => randomBytes(32).toString('base64url'),
    hashRefreshToken: (token) => createHash('sha256').update(token).digest('hex'),
  };
}