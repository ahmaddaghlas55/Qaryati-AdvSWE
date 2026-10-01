import { config, type Config } from './config';
import { GovernorateController } from './modules/governorates/governorates.controller';           // NEW
import { PrismaGovernorateRepository } from './modules/governorates/governorates.prisma-repository'; // NEW
import { GovernorateService } from './modules/governorates/governorates.service';                 // NEW
import type { Cache } from './shared/cache/cache';
import { LruCache } from './shared/cache/lru-cache';
import { prisma } from './shared/db/prisma';
import { UnitOfWork } from './shared/db/unit-of-work';

export interface Container {
  config: Config;
  prisma: typeof prisma;
  unitOfWork: UnitOfWork;
  cache: Cache;
  governorateController: GovernorateController; // NEW
}

export function createContainer(): Container {
  const cache: Cache = new LruCache();

  // Governorates module                                                      // NEW
  const governorateRepository = new PrismaGovernorateRepository(prisma);      // NEW
  const governorateService = new GovernorateService(governorateRepository);   // NEW
  const governorateController = new GovernorateController(governorateService); // NEW

  return {
    config,
    prisma,
    unitOfWork: new UnitOfWork(),
    cache,
    governorateController, // NEW
  };
}

export const container = createContainer();