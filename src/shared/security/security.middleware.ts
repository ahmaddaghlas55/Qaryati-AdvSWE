import cors, { type CorsOptions } from 'cors';
import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

import { RateLimitedError } from '../errors/app-error';

export interface RateLimitConfig {
  windowMs: number;
  generalLimit: number;
  authenticationLimit: number;
}

export function createCorsMiddleware(origins: readonly string[]): RequestHandler {
  const options: CorsOptions = { origin: [...origins] };
  return cors(options);
}

export function createRateLimiters(config: RateLimitConfig): {
  general: RequestHandler;
  authentication: RequestHandler;
} {
  const common = {
    windowMs: config.windowMs,
    standardHeaders: true as const,
    legacyHeaders: false as const,
    handler: (_req: Parameters<RequestHandler>[0], _res: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2]) => {
      next(new RateLimitedError());
    },
  };

  return {
    general: rateLimit({ ...common, limit: config.generalLimit }),
    authentication: rateLimit({ ...common, limit: config.authenticationLimit }),
  };
}