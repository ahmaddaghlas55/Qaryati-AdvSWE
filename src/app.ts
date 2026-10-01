import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { container } from './container';
import { errorHandler } from './shared/http/error-handler';
import { notFoundHandler } from './shared/http/not-found-handler';
import { requestIdMiddleware } from './shared/http/request-id.middleware';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: container.config.corsOrigins }));
  app.use(requestIdMiddleware);
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => res.status(200).json({ status: 'Alive' }));
  app.get('/ready', async (_req, res, next) => {
    try {
      await container.prisma.$queryRaw`SELECT 1`;
      res.status(200).json({ status: 'ready' });
    } catch (error) {
      next(error);
    }
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
