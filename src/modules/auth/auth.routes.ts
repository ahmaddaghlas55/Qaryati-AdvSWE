import { Router } from 'express';

import { AuthController, type AuthRouteMiddleware } from './auth.controller';
import { requireCanManageRoles } from './auth.middleware';

export function createAuthRouter(
  controller: AuthController,
  middleware: AuthRouteMiddleware,
): Router {
  const router = Router();

  router.use(middleware.authenticationRateLimit);
  router.post('/login', controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);
  router.get('/me', middleware.authenticate, controller.me);

  return router;
}

export function createUserRoleRouter(
  controller: AuthController,
  middleware: Pick<AuthRouteMiddleware, 'authenticate'>,
): Router {
  const router = Router();
  router.patch('/:id/role', middleware.authenticate, requireCanManageRoles(), controller.updateUserRole);
  return router;
}