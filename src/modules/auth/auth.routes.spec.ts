import express, { type ErrorRequestHandler } from 'express';
import request from 'supertest';

import { AppError } from '../../shared/errors/app-error';
import { FixedClock } from '../../shared/time/clock';
import { createRateLimiters } from '../../shared/security/security.middleware';
import { AuthController } from './auth.controller';
import { createAuthCrypto } from './auth.crypto';
import { authenticate } from './auth.middleware';
import type { AuthRepository, AuthUser, RefreshTokenRotation, RefreshRotationResult } from './auth.repository';
import { createAuthRouter } from './auth.routes';
import { AuthService } from './auth.service';

describe('standalone auth router', () => {
  it('supports login, refresh rotation/reuse, current user, and logout', async () => {
    const now = new Date('2026-11-27T12:00:00.000Z');
    const crypto = createAuthCrypto('standalone-test-secret-that-is-long-enough');
    const user: AuthUser = {
      id: '18',
      email: 'member@example.com',
      passwordHash: await crypto.hashPassword('correct-password'),
      role: 'contributor',
      isActive: true,
    };
    const storedTokens = new Map<string, { expiresAt: Date; revokedAt: Date | null }>();

    const repository: AuthRepository = {
      findUserByEmail: async (email) => email === user.email ? user : null,
      findUserById: async (id) => id === user.id ? user : null,
      createInitialAdmin: async () => false,
      updateUserRole: async (targetUserId, role) => ({
        status: 'updated',
        user: { id: targetUserId, email: user.email, role },
      }),
      createRefreshToken: async (_userId, tokenHash, expiresAt) => {
        storedTokens.set(tokenHash, { expiresAt, revokedAt: null });
      },
      rotateRefreshToken: async (tokenHash, replacement): Promise<RefreshRotationResult> => {
        const existing = storedTokens.get(tokenHash);
        if (!existing || existing.expiresAt <= now) return { status: 'invalid' };
        if (existing.revokedAt) return { status: 'reused' };
        existing.revokedAt = replacement.now;
        storedTokens.set(replacement.tokenHash, {
          expiresAt: replacement.expiresAt,
          revokedAt: null,
        });
        return { status: 'rotated', user };
      },
      revokeRefreshToken: async (tokenHash, revokedAt) => {
        const token = storedTokens.get(tokenHash);
        if (token) token.revokedAt = revokedAt;
      },
    };

    const service = new AuthService(repository, crypto, new FixedClock(now));
    const controller = new AuthController(service);
    const app = express();
    app.use(express.json());
    app.use('/api/v1/auth', createAuthRouter(controller, {
      authenticate: authenticate(service),
      authenticationRateLimit: createRateLimiters({
        windowMs: 60_000,
        generalLimit: 100,
        authenticationLimit: 10,
      }).authentication,
    }));
    const errors: ErrorRequestHandler = (error, _req, res, _next) => {
      res.status(error instanceof AppError ? error.statusCode : 500).json({
        error: error instanceof AppError ? error.code : 'INTERNAL_ERROR',
      });
    };
    app.use(errors);

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'correct-password' });
    expect(login.status).toBe(200);
    const firstSession = login.body.data as { accessToken: string; refreshToken: string };
    expect(login.body.data.user.passwordHash).toBeUndefined();

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${firstSession.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data).toEqual({ id: user.id, email: user.email, role: user.role });

    const refresh = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: firstSession.refreshToken });
    expect(refresh.status).toBe(200);
    const secondSession = refresh.body.data as { refreshToken: string };

    const replay = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: firstSession.refreshToken });
    expect(replay.status).toBe(401);

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: secondSession.refreshToken });
    expect(logout.status).toBe(200);

    const afterLogout = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: secondSession.refreshToken });
    expect(afterLogout.status).toBe(401);

    const missingIdentity = await request(app).get('/api/v1/auth/me');
    expect(missingIdentity.status).toBe(401);
  });
});