import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { container } from './container';
import { errorHandler } from './shared/http/error-handler';
import { notFoundHandler } from './shared/http/not-found-handler';
import { requestIdMiddleware } from './shared/http/request-id.middleware';
import { createGovernorateRouter } from './modules/governorates/governorates.routes';
import { createVillageRouter } from './modules/villages/villages.routes';

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
  
  app.use('/api/v1/governorates', createGovernorateRouter(container.governorateController));
  app.use('/api/v1/villages', createVillageRouter(container.villageController));

  // Error handling middleware should be the last middleware added
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
