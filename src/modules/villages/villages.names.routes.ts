
import { Router } from 'express';

import { VillageNamesController } from './villages.names.controller';

export function createVillageNamesRouter(
  controller: VillageNamesController
): Router {
  const router = Router({ mergeParams: true });

  router.get('/', controller.listCurrent);
  router.get('/history', controller.listHistory);

  return router;
}
