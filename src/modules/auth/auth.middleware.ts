import type { RequestHandler } from 'express';

import { ForbiddenError, UnauthenticatedError } from '../../shared/errors/app-error';
import type { AuthActor, AuthRole } from './auth.repository';
import type { AuthService } from './auth.service';
import { canManageRoles } from './authorization.policies';

export const authenticate: (service: AuthService) => RequestHandler = (service) => async (req, res, next) => {
  const authorization = req.header('authorization');
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) throw new UnauthenticatedError();

  const actor = await service.authenticateAccessToken(match[1]!);
  if (!actor) throw new UnauthenticatedError('Invalid or expired access token');

  res.locals.authActor = actor;
  next();
};

export function requireAuthenticated(): RequestHandler {
  return (_req, res, next) => {
    if (!getActor(res)) return next(new UnauthenticatedError());
    next();
  };
}

export function requireRole(...roles: AuthRole[]): RequestHandler {
  return (_req, res, next) => {
    const actor = getActor(res);
    if (!actor) return next(new UnauthenticatedError());
    if (!roles.includes(actor.role)) return next(new ForbiddenError());
    next();
  };
}

export function getActor(res: { locals: Record<string, unknown> }): AuthActor | null {
  const actor = res.locals.authActor as AuthActor | undefined;
  return actor && typeof actor.userId === 'string' && typeof actor.role === 'string'
    ? actor
    : null;
}

export function requireCanManageRoles(): RequestHandler {
  return (_req, res, next) => {
    const actor = getActor(res);
    if (!actor) return next(new UnauthenticatedError());
    if (!canManageRoles(actor)) return next(new ForbiddenError());
    next();
  };
}