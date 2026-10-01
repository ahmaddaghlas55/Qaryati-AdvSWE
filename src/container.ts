import { config, type Config } from './config';
import type { Cache } from './shared/cache/cache';
import { LruCache } from './shared/cache/lru-cache';
import { prisma } from './shared/db/prisma';
import { UnitOfWork } from './shared/db/unit-of-work';

export interface Container {
  config: Config;
  prisma: typeof prisma;
  unitOfWork: UnitOfWork;
  cache: Cache;
}

export function createContainer(): Container {
  const cache: Cache = new LruCache();
  // Future modules and their services are constructed and wired here.
  return { config, prisma, unitOfWork: new UnitOfWork(), cache };
}

export const container = createContainer();
