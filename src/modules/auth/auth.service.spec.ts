import { FixedClock } from '../../shared/time/clock';
import type { AuthCrypto } from './auth.crypto';
import type {
  AuthRepository,
  AuthUser,
  RefreshRotationResult,
  RefreshTokenRotation,
} from './auth.repository';
import { AuthService } from './auth.service';

const activeUser: AuthUser = {
  id: '7',
  email: 'user@example.com',
  passwordHash: 'stored-hash',
  role: 'contributor',
  isActive: true,
};

describe('AuthService', () => {
  const now = new Date('2026-11-27T12:00:00.000Z');

  function createHarness(overrides: Partial<AuthRepository> = {}) {
    let rotationResult: RefreshRotationResult = { status: 'rotated', user: activeUser };
    let rotationArgs: { currentHash: string; replacement: RefreshTokenRotation } | undefined;
    let createdToken: { userId: string; tokenHash: string; expiresAt: Date } | undefined;
    let revoked: { tokenHash: string; now: Date } | undefined;
    const repository: AuthRepository = {
      findUserByEmail: async () => activeUser,
      findUserById: async () => activeUser,
      createInitialAdmin: async () => true,
      updateUserRole: async (targetUserId, role) => ({
        status: 'updated',
        user: { id: targetUserId, email: activeUser.email, role },
      }),
      createRefreshToken: async (userId, tokenHash, expiresAt) => {
        createdToken = { userId, tokenHash, expiresAt };
      },
      rotateRefreshToken: async (currentHash, replacement) => {
        rotationArgs = { currentHash, replacement };
        return rotationResult;
      },
      revokeRefreshToken: async (tokenHash, at) => {
        revoked = { tokenHash, now: at };
      },
      ...overrides,
    };
    const crypto: AuthCrypto = {
      hashPassword: async (password) => `hashed:${password}`,
      verifyPassword: async (password, passwordHash) => passwordHash === `hashed:${password}`,
      createAccessToken: (userId) => `access:${userId}`,
      verifyAccessToken: (token) => token.startsWith('access:') ? token.slice(7) : null,
      createRefreshToken: () => 'new-random-refresh-token-12345678901234567890',
      hashRefreshToken: (token) => `digest:${token}`,
    };
    const service = new AuthService(repository, crypto, new FixedClock(now));
    return {
      service,
      setRotationResult(result: RefreshRotationResult) { rotationResult = result; },
      get rotationArgs() { return rotationArgs; },
      get createdToken() { return createdToken; },
      get revoked() { return revoked; },
    };
  }

  it('logs in and returns a safe public profile plus tokens', async () => {
    const harness = createHarness({
      findUserByEmail: async () => ({ ...activeUser, passwordHash: 'hashed:secret' }),
    });
    const session = await harness.service.login('user@example.com', 'secret');
    expect(session.user).toEqual({ id: '7', email: 'user@example.com', role: 'contributor' });
    expect(Object.hasOwn(session.user, 'passwordHash')).toBeFalse();
    expect(session.accessToken).toBe('access:7');
    expect(harness.createdToken?.tokenHash).toBe('digest:new-random-refresh-token-12345678901234567890');
    expect(harness.createdToken!.expiresAt.getTime() - now.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('uses the same login error for unknown email and a bad password', async () => {
    const unknown = createHarness({ findUserByEmail: async () => null });
    const incorrect = createHarness({
      findUserByEmail: async () => ({ ...activeUser, passwordHash: 'not-matching' }),
    });
    await expectAsync(unknown.service.login('missing@example.com', 'bad'))
      .toBeRejectedWithError('Invalid email or password');
    await expectAsync(incorrect.service.login('user@example.com', 'bad'))
      .toBeRejectedWithError('Invalid email or password');
  });

  it('rejects inactive users', async () => {
    const harness = createHarness({
      findUserByEmail: async () => ({ ...activeUser, isActive: false }),
    });
    await expectAsync(harness.service.login('user@example.com', 'secret'))
      .toBeRejectedWithError('Invalid email or password');
  });

  it('rotates a refresh token using only digests and a seven day expiry', async () => {
    const harness = createHarness();
    const session = await harness.service.refresh('old-random-refresh-token-1234567890');
    expect(harness.rotationArgs?.currentHash).toBe('digest:old-random-refresh-token-1234567890');
    expect(harness.rotationArgs?.replacement.tokenHash).toBe(`digest:${session.refreshToken}`);
    expect(harness.rotationArgs!.replacement.expiresAt.getTime() - now.getTime())
      .toBe(7 * 24 * 60 * 60 * 1000);
    expect(session.user.id).toBe('7');
  });

  it('rejects invalid and reused refresh tokens with a safe response', async () => {
    const harness = createHarness();
    harness.setRotationResult({ status: 'reused' });
    await expectAsync(harness.service.refresh('replayed-refresh-token-123456789012'))
      .toBeRejectedWithError('Invalid refresh token');
    harness.setRotationResult({ status: 'invalid' });
    await expectAsync(harness.service.refresh('expired-refresh-token-123456789012'))
      .toBeRejectedWithError('Invalid refresh token');
  });

  it('rejects refresh for an inactive account', async () => {
    const harness = createHarness();
    harness.setRotationResult({ status: 'rotated', user: { ...activeUser, isActive: false } });
    await expectAsync(harness.service.refresh('valid-refresh-token-123456789012345'))
      .toBeRejectedWithError('Invalid refresh token');
  });

  it('revokes the hashed refresh token on logout', async () => {
    const harness = createHarness();
    await harness.service.logout('refresh-token-12345678901234567890');
    expect(harness.revoked).toEqual({
      tokenHash: 'digest:refresh-token-12345678901234567890',
      now,
    });
  });

  it('hashes and normalizes the initial admin credentials before repository creation', async () => {
    let bootstrap: { email: string; passwordHash: string } | undefined;
    const harness = createHarness({
      createInitialAdmin: async (email, passwordHash) => {
        bootstrap = { email, passwordHash };
        return true;
      },
    });

    await expectAsync(harness.service.bootstrapInitialAdmin('Admin@Example.com', 'secret'))
      .toBeResolvedTo(true);
    expect(bootstrap).toEqual({ email: 'admin@example.com', passwordHash: 'hashed:secret' });
  });

  it('skips bootstrap when both credentials are absent', async () => {
    let repositoryCalls = 0;
    const harness = createHarness({
      createInitialAdmin: async () => {
        repositoryCalls += 1;
        return true;
      },
    });

    await expectAsync(harness.service.bootstrapInitialAdmin()).toBeResolvedTo(false);
    expect(repositoryCalls).toBe(0);
  });

  it('rejects partial or malformed bootstrap credentials without calling the repository', async () => {
    let repositoryCalls = 0;
    const harness = createHarness({
      createInitialAdmin: async () => {
        repositoryCalls += 1;
        return true;
      },
    });

    await expectAsync(harness.service.bootstrapInitialAdmin('admin@example.com'))
      .toBeRejectedWithError('Invalid admin bootstrap configuration');
    await expectAsync(harness.service.bootstrapInitialAdmin('not-an-email', 'secret'))
      .toBeRejectedWithError('Invalid admin bootstrap configuration');
    await expectAsync(harness.service.bootstrapInitialAdmin('admin@example.com', 'x'.repeat(73)))
      .toBeRejectedWithError('Invalid admin bootstrap configuration');
    expect(repositoryCalls).toBe(0);
  });

  it('allows only the first bootstrap creation and preserves existing users', async () => {
    let userExists = false;
    const harness = createHarness({
      createInitialAdmin: async () => {
        if (userExists) return false;
        userExists = true;
        return true;
      },
    });

    await expectAsync(harness.service.bootstrapInitialAdmin('admin@example.com', 'secret'))
      .toBeResolvedTo(true);
    await expectAsync(harness.service.bootstrapInitialAdmin('admin@example.com', 'different-secret'))
      .toBeResolvedTo(false);
  });

  it('loads identity and current user from the repository after token verification', async () => {
    const harness = createHarness();
    await expectAsync(harness.service.authenticateAccessToken('access:7'))
      .toBeResolvedTo({ userId: '7', role: 'contributor' });
    await expectAsync(harness.service.authenticateAccessToken('bad-token')).toBeResolvedTo(null);
    await expectAsync(harness.service.getCurrentUser('7')).toBeResolvedTo({
      id: '7', email: 'user@example.com', role: 'contributor',
    });
  });
});