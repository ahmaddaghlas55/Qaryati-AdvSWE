import type { ErrorRequestHandler } from 'express';

import { AppError } from '../errors/app-error';
import { getRequestId } from '../logging/request-context';
import { logger } from '../logging/logger';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const requestId = getRequestId() ?? 'unknown';
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
  logger.error({ err: error, requestId }, 'Unexpected error');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: [],
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
};
