import { config, type Config } from './config';
import { GovernorateController } from './modules/governorates/governorates.controller';           // NEW
import { PrismaGovernorateRepository } from './modules/governorates/governorates.prisma-repository'; // NEW
import { GovernorateService } from './modules/governorates/governorates.service';                 // NEW
import { SourcesController } from './modules/sources/sources.controller';
import { PrismaSourcesRepository } from './modules/sources/sources.prisma-repository';
import { SourcesService } from './modules/sources/sources.service';
import { VillageController } from './modules/villages/villages.controller';
import { PrismaVillageRepository } from './modules/villages/villages.prisma-repository';
import { VillageService } from './modules/villages/villages.service';
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
  villageController: VillageController;
  sourcesController: SourcesController;
}

export function createContainer(): Container {
  const cache: Cache = new LruCache();

  // Governorates module                                                      // NEW
  const governorateRepository = new PrismaGovernorateRepository(prisma);      // NEW
  const governorateService = new GovernorateService(governorateRepository);   // NEW
  const governorateController = new GovernorateController(governorateService); // NEW

  const villageRepository = new PrismaVillageRepository(prisma);
  const villageService = new VillageService(villageRepository);
  const villageController = new VillageController(villageService);

  const sourcesRepository = new PrismaSourcesRepository(prisma);
  const sourcesService = new SourcesService(sourcesRepository);
  const sourcesController = new SourcesController(sourcesService);

  return {
    config,
    prisma,
    unitOfWork: new UnitOfWork(),
    cache,
    governorateController, // NEW
    villageController,
    sourcesController,
  };
}

export const container = createContainer();
