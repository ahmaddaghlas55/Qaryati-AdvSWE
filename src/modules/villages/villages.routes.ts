import { Router } from 'express';

import { VillageController } from './villages.controller';

export function createVillageRouter(controller: VillageController): Router {
  const router = Router();
  router.get('/', controller.list);
  router.get('/:slug', controller.getBySlug);
  return router;
}
