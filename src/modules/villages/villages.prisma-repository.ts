import { Prisma, PrismaClient } from '@prisma/client';

import {
  VillageDetail,
  VillagePageQuery,
  VillageRepository,
  VillageSummary,
} from './villages.repository';

interface VillageRow {
  slug: string;
  name_ar: string | null;
  name_en: string | null;
  governorate_slug: string;
  governorate_name_ar: string;
  governorate_name_en: string;
  municipality: string | null;
  overview?: string | null;
  elevation_m?: Prisma.Decimal | null;
  area_km2?: Prisma.Decimal | null;
  updated_at: Date;
}

interface CountRow {
  total_items: bigint;
}

export class PrismaVillageRepository implements VillageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findPage(query: VillagePageQuery): Promise<{
    items: VillageSummary[];
    totalItems: number;
  }> {
    const governorateFilter = query.governorateSlug
      ? Prisma.sql`AND g.slug = ${query.governorateSlug}`
      : Prisma.empty;
    const orderBy =
      query.sort === 'updatedAt'
        ? query.order === 'asc'
          ? Prisma.sql`v.updated_at ASC`
          : Prisma.sql`v.updated_at DESC`
        : query.order === 'asc'
          ? Prisma.sql`v.slug ASC`
          : Prisma.sql`v.slug DESC`;

    const [countRows, pageRows] = await this.prisma.$transaction([
      this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS total_items
        FROM villages v
        INNER JOIN governorates g ON g.id = v.governorate_id
        WHERE v.status = ${query.status}
          AND v.deleted_at IS NULL
          ${governorateFilter}
      `),
      this.prisma.$queryRaw<VillageRow[]>(Prisma.sql`
        SELECT
          v.slug,
          MAX(vn.value) FILTER (WHERE vn.language = 'ar') AS name_ar,
          MAX(vn.value) FILTER (WHERE vn.language = 'en') AS name_en,
          g.slug AS governorate_slug,
          g.name_ar AS governorate_name_ar,
          g.name_en AS governorate_name_en,
          v.municipality,
          v.updated_at
        FROM villages v
        INNER JOIN governorates g ON g.id = v.governorate_id
        LEFT JOIN village_names vn
          ON vn.village_id = v.id
          AND vn.is_current = TRUE
          AND vn.type = 'official'
          AND vn.status = 'verified'
          AND vn.deleted_at IS NULL
        WHERE v.status = ${query.status}
          AND v.deleted_at IS NULL
          ${governorateFilter}
        GROUP BY v.id, v.slug, g.slug, g.name_ar, g.name_en, v.municipality, v.updated_at
        ORDER BY ${orderBy}
        OFFSET ${query.skip}
        LIMIT ${query.take}
      `),
    ]);

    return {
      items: pageRows.map((row) => this.toSummary(row)),
      totalItems: Number(countRows[0]?.total_items ?? 0n),
    };
  }

  async findBySlug(slug: string, status: string): Promise<VillageDetail | null> {
    const rows = await this.prisma.$queryRaw<VillageRow[]>(Prisma.sql`
      SELECT
        v.slug,
        MAX(vn.value) FILTER (WHERE vn.language = 'ar') AS name_ar,
        MAX(vn.value) FILTER (WHERE vn.language = 'en') AS name_en,
        g.slug AS governorate_slug,
        g.name_ar AS governorate_name_ar,
        g.name_en AS governorate_name_en,
        v.municipality,
        v.overview,
        v.elevation_m,
        v.area_km2,
        v.updated_at
      FROM villages v
      INNER JOIN governorates g ON g.id = v.governorate_id
      LEFT JOIN village_names vn
        ON vn.village_id = v.id
        AND vn.is_current = TRUE
        AND vn.type = 'official'
        AND vn.status = 'verified'
        AND vn.deleted_at IS NULL
      WHERE v.slug = ${slug}
        AND v.status = ${status}
        AND v.deleted_at IS NULL
      GROUP BY
        v.id, v.slug, g.slug, g.name_ar, g.name_en, v.municipality,
        v.overview, v.elevation_m, v.area_km2, v.updated_at
    `);

    const row = rows[0];
    return row ? this.toDetail(row) : null;
  }

  private toSummary(row: VillageRow): VillageSummary {
    return {
      slug: row.slug,
      name: { ar: row.name_ar, en: row.name_en },
      governorate: {
        slug: row.governorate_slug,
        nameAr: row.governorate_name_ar,
        nameEn: row.governorate_name_en,
      },
      municipality: row.municipality,
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private toDetail(row: VillageRow): VillageDetail {
    return {
      ...this.toSummary(row),
      overview: row.overview ?? null,
      elevationM: row.elevation_m == null ? null : Number(row.elevation_m),
      areaKm2: row.area_km2 == null ? null : Number(row.area_km2),
    };
  }
}
