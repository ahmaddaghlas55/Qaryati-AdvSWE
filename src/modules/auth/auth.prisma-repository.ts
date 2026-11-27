import type { PrismaClient } from '@prisma/client';

import type {
  AuthRepository,
  AuthUser,
  RefreshRotationResult,
  RefreshTokenRotation,
  AuthRole,
  UserRoleUpdateResult,
} from './auth.repository';

interface UserRecord {
  id: bigint;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
}

function toAuthUser(user: UserRecord): AuthUser {
  return {
    id: user.id.toString(),
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    isActive: user.isActive,
  };
}

export class PrismaAuthRepository implements AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.prisma.appUser.findUnique({ where: { email } });
    return user ? toAuthUser(user) : null;
  }

  async findUserById(id: string): Promise<AuthUser | null> {
    let userId: bigint;
    try {
      userId = BigInt(id);
    } catch {
      return null;
    }
    const user = await this.prisma.appUser.findUnique({ where: { id: userId } });
    return user ? toAuthUser(user) : null;
  }

  async createInitialAdmin(email: string, passwordHash: string): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const users = await transaction.appUser.count();
      if (users !== 0) return false;

      await transaction.appUser.create({
        data: { email, passwordHash, role: 'admin', isActive: true },
      });
      return true;
    }, { isolationLevel: 'Serializable' });
  }

  async updateUserRole(
    targetUserId: string,
    role: AuthRole,
    actorUserId: string,
    requestId?: string,
  ): Promise<UserRoleUpdateResult> {
    let targetId: bigint;
    let actorId: bigint;
    try {
      targetId = BigInt(targetUserId);
      actorId = BigInt(actorUserId);
    } catch {
      return { status: 'not_found' };
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const target = await transaction.appUser.findUnique({
          where: { id: targetId },
          select: { id: true, email: true, role: true, isActive: true },
        });
        if (!target) return { status: 'not_found' };

        if (target.isActive && target.role === 'admin' && role !== 'admin') {
          const activeAdmins = await transaction.appUser.count({
            where: { role: 'admin', isActive: true },
          });
          if (activeAdmins <= 1) return { status: 'last_active_admin' };
        }

        if (target.role === role) {
          return {
            status: 'updated',
            user: { id: target.id.toString(), email: target.email, role },
          };
        }

        const updated = await transaction.appUser.update({
          where: { id: targetId },
          data: { role },
          select: { id: true, email: true, role: true },
        });
        await transaction.auditLog.create({
          data: {
            actorId,
            requestId: requestId ?? null,
            entityType: 'AppUser',
            entityId: targetId,
            action: 'USER_ROLE_UPDATED',
            oldValue: { role: target.role },
            newValue: { role: updated.role },
          },
        });

        return {
          status: 'updated',
          user: { id: updated.id.toString(), email: updated.email, role: updated.role as AuthRole },
        };
      }, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (isSerializationConflict(error)) return { status: 'conflict' };
      throw error;
    }
  }

  async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.refreshToken.create({
      data: { userId: BigInt(userId), tokenHash, expiresAt },
    });
  }

  async rotateRefreshToken(
    currentTokenHash: string,
    replacement: RefreshTokenRotation,
  ): Promise<RefreshRotationResult> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
      const token = await transaction.refreshToken.findFirst({
        where: { tokenHash: currentTokenHash },
        include: { user: true },
      });

      if (!token) return { status: 'invalid' };

      if (token.revokedAt) {
        await transaction.refreshToken.updateMany({
          where: { userId: token.userId, revokedAt: null },
          data: { revokedAt: replacement.now },
        });
        return { status: 'reused' };
      }

      if (token.expiresAt <= replacement.now || !token.user.isActive) {
        return { status: 'invalid' };
      }

      const claim = await transaction.refreshToken.updateMany({
        where: {
          id: token.id,
          revokedAt: null,
          expiresAt: { gt: replacement.now },
        },
        data: { revokedAt: replacement.now },
      });

      if (claim.count !== 1) return { status: 'reused' };

      const next = await transaction.refreshToken.create({
        data: {
          userId: token.userId,
          tokenHash: replacement.tokenHash,
          expiresAt: replacement.expiresAt,
        },
      });

      await transaction.refreshToken.update({
        where: { id: token.id },
        data: { replacedBy: next.id },
      });

      return { status: 'rotated', user: toAuthUser(token.user) };
      }, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (!isSerializationConflict(error)) throw error;

      const token = await this.prisma.refreshToken.findFirst({
        where: { tokenHash: currentTokenHash },
        select: { userId: true },
      });
      if (token) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: token.userId, revokedAt: null },
          data: { revokedAt: replacement.now },
        });
      }
      return { status: 'reused' };
    }
  }

  async revokeRefreshToken(tokenHash: string, now: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}

function isSerializationConflict(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 'P2034';
}