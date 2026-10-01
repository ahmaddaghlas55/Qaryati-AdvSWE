import type { RequestHandler } from 'express';

import { NotFoundError } from '../errors/app-error';
import { errorHandler } from './error-handler';

export const notFoundHandler: RequestHandler = (req, res, next) => {
  errorHandler(new NotFoundError(`Route not found: ${req.method} ${req.path}`), req, res, next);
};
