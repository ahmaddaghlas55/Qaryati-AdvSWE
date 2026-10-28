
import { Router } from 'express';

import { VillageController } from './villages.controller';
import { VillageNamesController } from './villages.names.controller';
import { createVillageNamesRouter } from './villages.names.routes';

export function createVillageRouter(
  controller: VillageController,
  namesController: VillageNamesController
): Router {
  const router = Router();

  router.get('/', controller.list);

  router.use(
    '/:slug/names',
    createVillageNamesRouter(namesController)
  );

  router.get('/:slug', controller.getBySlug);

  return router;
}
