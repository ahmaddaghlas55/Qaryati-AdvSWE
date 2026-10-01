import { Router } from 'express';

import { GovernorateController } from './governorates.controller';

export function createGovernorateRouter(controller: GovernorateController): Router {
  const router = Router();
  router.get('/', controller.list);
  return router;
}