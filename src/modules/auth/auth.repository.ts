export const AUTH_ROLES = ['contributor', 'verifier', 'admin'] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export interface AuthActor {
  userId: string;
  role: AuthRole;
}

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
}

export interface UserRoleRecord {
  id: string;
  email: string;
  role: AuthRole;
}

export type UserRoleUpdateResult =
  | { status: 'updated'; user: UserRoleRecord }
  | { status: 'not_found' }
  | { status: 'last_active_admin' }
  | { status: 'conflict' };

export interface RefreshTokenRotation {
  tokenHash: string;
  expiresAt: Date;
  now: Date;
}

export type RefreshRotationResult =
  | { status: 'rotated'; user: AuthUser }
  | { status: 'invalid' | 'reused' };

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUser | null>;
  findUserById(id: string): Promise<AuthUser | null>;
  createInitialAdmin(email: string, passwordHash: string): Promise<boolean>;
  updateUserRole(
    targetUserId: string,
    role: AuthRole,
    actorUserId: string,
    requestId?: string,
  ): Promise<UserRoleUpdateResult>;
  createRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  rotateRefreshToken(
    currentTokenHash: string,
    replacement: RefreshTokenRotation,
  ): Promise<RefreshRotationResult>;
  revokeRefreshToken(tokenHash: string, now: Date): Promise<void>;
}