import { ConflictError, ForbiddenError, NotFoundError, UnauthenticatedError, ValidationError } from '../../shared/errors/app-error';
import type { Clock } from '../../shared/time/clock';
import type { AuthCrypto } from './auth.crypto';
import { AUTH_ROLES, type AuthActor, type AuthRepository, type AuthRole, type AuthUser, type UserRoleRecord } from './auth.repository';
import { adminBootstrapCredentialsSchema, userRoleBodySchema } from './auth.schemas';
import { canManageRoles } from './authorization.policies';

const ACCESS_TOKEN_ERROR = 'Invalid email or password';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface PublicAuthUser {
  id: string;
  email: string;
  role: AuthRole;
}

export interface AuthSession {
  user: PublicAuthUser;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly crypto: AuthCrypto,
    private readonly clock: Clock,
  ) {}

  async login(email: string, password: string): Promise<AuthSession> {
    const user = await this.repository.findUserByEmail(email);
    if (!user || !user.isActive || !this.isAuthRole(user.role)) {
      throw new UnauthenticatedError(ACCESS_TOKEN_ERROR);
    }

    const validPassword = await this.crypto.verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthenticatedError(ACCESS_TOKEN_ERROR);
    }

    return this.createSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    const now = this.clock.now();
    const nextRefreshToken = this.crypto.createRefreshToken();
    const rotation = await this.repository.rotateRefreshToken(
      this.crypto.hashRefreshToken(refreshToken),
      {
        tokenHash: this.crypto.hashRefreshToken(nextRefreshToken),
        expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
        now,
      },
    );

    if (rotation.status !== 'rotated' || !rotation.user.isActive || !this.isAuthRole(rotation.user.role)) {
      throw new UnauthenticatedError('Invalid refresh token');
    }

    return {
      user: this.toPublicUser(rotation.user),
      accessToken: this.crypto.createAccessToken(rotation.user.id),
      refreshToken: nextRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.repository.revokeRefreshToken(
      this.crypto.hashRefreshToken(refreshToken),
      this.clock.now(),
    );
  }

  async authenticateAccessToken(token: string): Promise<AuthActor | null> {
    const userId = this.crypto.verifyAccessToken(token);
    if (!userId) return null;

    const user = await this.repository.findUserById(userId);
    if (!user || !user.isActive || !this.isAuthRole(user.role)) return null;

    return { userId: user.id, role: user.role };
  }

  async getCurrentUser(userId: string): Promise<PublicAuthUser> {
    const user = await this.repository.findUserById(userId);
    if (!user || !user.isActive || !this.isAuthRole(user.role)) {
      throw new UnauthenticatedError();
    }
    return this.toPublicUser(user);
  }

  async updateUserRole(
    actor: AuthActor | null,
    targetUserId: string,
    requestedRole: unknown,
    requestId?: string,
  ): Promise<UserRoleRecord> {
    if (!actor) throw new UnauthenticatedError();
    if (!canManageRoles(actor)) throw new ForbiddenError();
    if (actor.userId === targetUserId) {
      throw new ForbiddenError('Admins cannot change their own role');
    }

    const parsedRole = userRoleBodySchema.safeParse({ role: requestedRole });
    if (!parsedRole.success) {
      throw new ValidationError(
        'Request validation failed',
        parsedRole.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'role',
          issue: issue.message,
        })),
      );
    }

    const result = await this.repository.updateUserRole(
      targetUserId,
      parsedRole.data.role,
      actor.userId,
      requestId,
    );
    if (result.status === 'not_found') throw new NotFoundError('User not found');
    if (result.status === 'last_active_admin') {
      throw new ConflictError('Cannot remove the last active admin');
    }
    if (result.status === 'conflict') {
      throw new ConflictError('User role changed concurrently; retry the request');
    }
    return result.user;
  }

  async bootstrapInitialAdmin(email?: string, password?: string): Promise<boolean> {
    if (email === undefined && password === undefined) return false;

    const result = adminBootstrapCredentialsSchema.safeParse({ email, password });
    if (!result.success) {
      throw new ValidationError(
        'Invalid admin bootstrap configuration',
        result.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'bootstrap',
          issue: issue.message,
        })),
      );
    }

    const passwordHash = await this.crypto.hashPassword(result.data.password);
    return this.repository.createInitialAdmin(result.data.email, passwordHash);
  }

  private async createSession(user: AuthUser): Promise<AuthSession> {
    const refreshToken = this.crypto.createRefreshToken();
    const now = this.clock.now();
    await this.repository.createRefreshToken(
      user.id,
      this.crypto.hashRefreshToken(refreshToken),
      new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
    );

    return {
      user: this.toPublicUser(user),
      accessToken: this.crypto.createAccessToken(user.id),
      refreshToken,
    };
  }

  private toPublicUser(user: AuthUser): PublicAuthUser {
    return { id: user.id, email: user.email, role: user.role as AuthRole };
  }

  private isAuthRole(role: string): role is AuthRole {
    return AUTH_ROLES.includes(role as AuthRole);
  }
}