import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

import { requestContext } from '../logging/request-context';

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const requestId = req.header('X-Request-Id') ?? randomUUID();
  res.setHeader('X-Request-Id', requestId);
  requestContext.run({ requestId }, next);
};
