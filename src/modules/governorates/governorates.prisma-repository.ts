import { PrismaClient } from '@prisma/client';

import { Governorate, GovernorateRepository } from './governorates.repository';

export class PrismaGovernorateRepository implements GovernorateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Governorate[]> {
    return this.prisma.governorate.findMany({
      select: { slug: true, nameAr: true, nameEn: true },
      orderBy: { nameEn: 'asc' },
    });
  }
}