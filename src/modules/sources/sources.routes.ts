
import { Router } from 'express';

import { SourcesController } from './sources.controller';

export function createSourcesRouter(controller: SourcesController): Router {
  const router = Router();

  router.get('/', controller.list);
  router.get('/:id', controller.getById);

  return router;
}
