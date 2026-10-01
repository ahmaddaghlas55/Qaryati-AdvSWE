import pino from 'pino';

import { config } from '../../config';
import { getRequestId } from './request-context';

export const logger = pino({
  level: config.LOG_LEVEL,
  transport:
    config.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: false } }
      : undefined,
  redact: ['req.headers.authorization', 'password', 'token', 'refreshToken', 'req.headers.cookie'],
  serializers: {
    req: (req) => ({ method: req.method, url: req.url, requestId: getRequestId() }),
  },
});
