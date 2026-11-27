import type { Request, RequestHandler, Response } from 'express';
import { z } from 'zod';

import { UnauthenticatedError, ValidationError } from '../../shared/errors/app-error';
import { getRequestId } from '../../shared/logging/request-context';
import { getActor } from './auth.middleware';
import { loginBodySchema, logoutBodySchema, refreshBodySchema, userRoleBodySchema, userRoleParamsSchema } from './auth.schemas';
import type { AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const body = this.parse(loginBodySchema, req.body);
    const session = await this.service.login(body.email, body.password);
    res.status(200).json({ data: session });
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const body = this.parse(refreshBodySchema, req.body);
    const session = await this.service.refresh(body.refreshToken);
    res.status(200).json({ data: session });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const body = this.parse(logoutBodySchema, req.body);
    await this.service.logout(body.refreshToken);
    res.status(200).json({ data: { loggedOut: true } });
  };

  me = async (_req: Request, res: Response): Promise<void> => {
    const actor = getActor(res);
    if (!actor) throw new UnauthenticatedError();
    const user = await this.service.getCurrentUser(actor.userId);
    res.status(200).json({ data: user });
  };

  updateUserRole = async (req: Request, res: Response): Promise<void> => {
    const params = this.parse(userRoleParamsSchema, req.params);
    const body = this.parse(userRoleBodySchema, req.body);
    const actor = getActor(res);
    const user = await this.service.updateUserRole(actor, params.id, body.role, getRequestId());
    res.status(200).json({ data: user });
  };

  private parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
    const result = schema.safeParse(input);
    if (!result.success) {
      throw new ValidationError(
        'Request validation failed',
        result.error.issues.map((issue) => ({
          field: issue.path.join('.') || 'request',
          issue: issue.message,
        })),
      );
    }
    return result.data;
  }
}

export interface AuthRouteMiddleware {
  authenticate: RequestHandler;
  authenticationRateLimit: RequestHandler;
}