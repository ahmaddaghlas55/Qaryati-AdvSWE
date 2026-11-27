import express, { type ErrorRequestHandler } from 'express';
import request from 'supertest';

import { AppError } from '../../shared/errors/app-error';
import { FixedClock } from '../../shared/time/clock';
import { AuthController } from './auth.controller';
import { createAuthCrypto } from './auth.crypto';
import { authenticate } from './auth.middleware';
import type { AuthRepository, AuthRole, AuthUser, UserRoleRecord } from './auth.repository';
import { createUserRoleRouter } from './auth.routes';
import { AuthService } from './auth.service';

describe('user role management route', () => {
  const activeUsers: AuthUser[] = [
    { id: '1', email: 'admin@example.com', passwordHash: 'not-returned', role: 'admin', isActive: true },
    { id: '2', email: 'contributor@example.com', passwordHash: 'not-returned', role: 'contributor', isActive: true },
    { id: '3', email: 'verifier@example.com', passwordHash: 'not-returned', role: 'verifier', isActive: true },
    { id: '4', email: 'second-admin@example.com', passwordHash: 'not-returned', role: 'admin', isActive: true },
  ];

  function createHarness(users = activeUsers) {
    const userRecords = new Map(users.map((user) => [user.id, { ...user }]));
    const repository: AuthRepository = {
      findUserByEmail: async (email) => [...userRecords.values()].find((user) => user.email === email) ?? null,
      findUserById: async (id) => userRecords.get(id) ?? null,
      createInitialAdmin: async () => false,
      updateUserRole: async (targetUserId, role) => {
        const target = userRecords.get(targetUserId);
        if (!target) return { status: 'not_found' };

        if (target.isActive && target.role === 'admin' && role !== 'admin') {
          const adminCount = [...userRecords.values()]
            .filter((user) => user.isActive && user.role === 'admin').length;
          if (adminCount <= 1) return { status: 'last_active_admin' };
        }

        target.role = role;
        const updatedUser: UserRoleRecord = {
          id: target.id,
          email: target.email,
          role: role as AuthRole,
        };
        return { status: 'updated', user: updatedUser };
      },
      createRefreshToken: async () => undefined,
      rotateRefreshToken: async () => ({ status: 'invalid' }),
      revokeRefreshToken: async () => undefined,
    };
    const crypto = createAuthCrypto('role-management-test-secret-with-enough-length');
    const service = new AuthService(repository, crypto, new FixedClock(new Date('2026-11-27T12:00:00.000Z')));
    const app = express();
    app.use(express.json());
    app.use('/api/v1/users', createUserRoleRouter(new AuthController(service), {
      authenticate: authenticate(service),
    }));
    const errors: ErrorRequestHandler = (error, _req, res, _next) => {
      res.status(error instanceof AppError ? error.statusCode : 500).json({
        error: error instanceof AppError ? error.code : 'INTERNAL_ERROR',
      });
    };
    app.use(errors);

    return {
      app,
      accessToken(userId: string) { return crypto.createAccessToken(userId); },
      getUser(userId: string) { return userRecords.get(userId); },
      service,
      repository,
    };
  }

  it('lets an Admin change another user role and returns only the safe DTO', async () => {
    const harness = createHarness();
    const response = await request(harness.app)
      .patch('/api/v1/users/2/role')
      .set('Authorization', `Bearer ${harness.accessToken('1')}`)
      .send({ role: 'verifier' });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      id: '2',
      email: 'contributor@example.com',
      role: 'verifier',
    });
    expect(response.body.data.passwordHash).toBeUndefined();
    expect(harness.getUser('2')?.role).toBe('verifier');
  });

  it('rejects unauthenticated requests', async () => {
    const harness = createHarness();
    const response = await request(harness.app)
      .patch('/api/v1/users/2/role')
      .send({ role: 'admin' });

    expect(response.status).toBe(401);
  });

  it('rejects Contributor and Verifier callers', async () => {
    const harness = createHarness();
    const contributorResponse = await request(harness.app)
      .patch('/api/v1/users/1/role')
      .set('Authorization', `Bearer ${harness.accessToken('2')}`)
      .send({ role: 'verifier' });
    const verifierResponse = await request(harness.app)
      .patch('/api/v1/users/1/role')
      .set('Authorization', `Bearer ${harness.accessToken('3')}`)
      .send({ role: 'contributor' });

    expect(contributorResponse.status).toBe(403);
    expect(verifierResponse.status).toBe(403);
  });

  it('rejects invalid roles and malformed IDs or request bodies', async () => {
    const harness = createHarness();
    const authorization = `Bearer ${harness.accessToken('1')}`;
    const invalidRole = await request(harness.app)
      .patch('/api/v1/users/2/role')
      .set('Authorization', authorization)
      .send({ role: 'public' });
    const malformedBody = await request(harness.app)
      .patch('/api/v1/users/2/role')
      .set('Authorization', authorization)
      .send({});
    const malformedId = await request(harness.app)
      .patch('/api/v1/users/not-an-id/role')
      .set('Authorization', authorization)
      .send({ role: 'admin' });

    expect(invalidRole.status).toBe(400);
    expect(malformedBody.status).toBe(400);
    expect(malformedId.status).toBe(400);
  });

  it('returns 404 for a missing target user', async () => {
    const harness = createHarness();
    const response = await request(harness.app)
      .patch('/api/v1/users/999/role')
      .set('Authorization', `Bearer ${harness.accessToken('1')}`)
      .send({ role: 'verifier' });

    expect(response.status).toBe(404);
  });

  it('does not trust client-supplied actor identity or role', async () => {
    const harness = createHarness();
    const response = await request(harness.app)
      .patch('/api/v1/users/1/role')
      .set('Authorization', `Bearer ${harness.accessToken('2')}`)
      .send({ role: 'verifier', actorId: '1', actorRole: 'admin' });

    expect(response.status).toBe(403);
    expect(harness.getUser('1')?.role).toBe('admin');
  });

  it('forbids an Admin from changing their own role', async () => {
    const harness = createHarness();
    const response = await request(harness.app)
      .patch('/api/v1/users/1/role')
      .set('Authorization', `Bearer ${harness.accessToken('1')}`)
      .send({ role: 'contributor' });

    expect(response.status).toBe(403);
    expect(harness.getUser('1')?.role).toBe('admin');
  });

  it('surfaces the last-active-Admin safeguard as a conflict', async () => {
    const onlyAdmin: AuthUser = {
      id: '1', email: 'admin@example.com', passwordHash: 'not-returned', role: 'admin', isActive: true,
    };
    const harness = createHarness([onlyAdmin]);

    await expectAsync(harness.service.updateUserRole(
      { userId: '2', role: 'admin' },
      '1',
      'contributor',
    )).toBeRejectedWithError('Cannot remove the last active admin');
  });
});