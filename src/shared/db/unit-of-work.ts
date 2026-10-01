import { Prisma } from '@prisma/client';

import { prisma } from './prisma';

export class UnitOfWork {
  run<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(fn);
  }
}
