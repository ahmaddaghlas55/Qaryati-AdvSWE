import { Prisma, PrismaClient } from '@prisma/client';

import {
  FindVillagesInGovernorateArgs,
  Governorate,
  GovernorateDetail,
  GovernorateRepository,
  VillageSummaryInGovernorate,
} from './governorates.repository';

interface VillageRow {
  slug: string;
  name_ar: string | null;
  name_en: string | null;
  municipality: string | null;
  updated_at: Date;
}

interface CountRow {
  total_items: bigint;
}

export class PrismaGovernorateRepository implements GovernorateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<Governorate[]> {
    return this.prisma.governorate.findMany({
      select: { slug: true, nameAr: true, nameEn: true },
      orderBy: { nameEn: 'asc' },
    });
  }

  async findBySlug(slug: string): Promise<GovernorateDetail | null> {
    return this.prisma.governorate.findUnique({
      where: { slug },
      select: { slug: true, nameAr: true, nameEn: true },
    });
  }

  // null means the governorate is missing; an empty page means it exists without verified villages.
  async findVillagesPage(
    args: FindVillagesInGovernorateArgs,
  ): Promise<{ items: VillageSummaryInGovernorate[]; totalItems: number } | null> {
    const governorate = await this.prisma.governorate.findUnique({
      where: { slug: args.governorateSlug },
      select: { id: true },
    });

    if (!governorate) {
      return null;
    }

    const orderBy =
      args.sort === 'updatedAt'
        ? args.order === 'asc'
          ? Prisma.sql`v.updated_at ASC`
          : Prisma.sql`v.updated_at DESC`
        : args.order === 'asc'
          ? Prisma.sql`v.slug ASC`
          : Prisma.sql`v.slug DESC`;

    const [countRows, pageRows] = await Promise.all([
      this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total_items
        FROM villages v
        WHERE v.governorate_id = ${governorate.id}
          AND v.status = 'verified'
          AND v.deleted_at IS NULL
      `),
      this.prisma.$queryRaw<VillageRow[]>(Prisma.sql`
        SELECT
          v.slug,
          MAX(vn.value) FILTER (WHERE vn.language = 'ar') AS name_ar,
          MAX(vn.value) FILTER (WHERE vn.language = 'en') AS name_en,
          v.municipality,
          v.updated_at
        FROM villages v
        LEFT JOIN village_names vn
          ON vn.village_id = v.id
          AND vn.is_current = TRUE
          AND vn.type = 'official'
          AND vn.status = 'verified'
          AND vn.deleted_at IS NULL
        WHERE v.governorate_id = ${governorate.id}
          AND v.status = 'verified'
          AND v.deleted_at IS NULL
        GROUP BY v.id, v.slug, v.municipality, v.updated_at
        ORDER BY ${orderBy}
        OFFSET ${args.skip}
        LIMIT ${args.take}
      `),
    ]);

    return {
      items: pageRows.map((row) => ({
        slug: row.slug,
        name: { ar: row.name_ar, en: row.name_en },
        municipality: row.municipality,
        updatedAt: row.updated_at.toISOString(),
      })),
      totalItems: Number(countRows[0]?.total_items ?? 0n),
    };
  }
}