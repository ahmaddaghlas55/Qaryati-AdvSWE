
import { Prisma, PrismaClient } from '@prisma/client';

import {
  VillageNameItem,
  VillageNamesRepository,
} from './villages.names.repository';

interface VillageNameRow {
  id: bigint;
  language: string;
  type: string;
  value: string;
  is_current: boolean;
  valid_from: string | null;
  valid_to: string | null;
  meaning_or_origin: string | null;
}

export class PrismaVillageNamesRepository implements VillageNamesRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findCurrentByVillageSlug(
    slug: string
  ): Promise<VillageNameItem[] | null> {
    const village = await this.findPublicVillage(slug);

    if (!village) {
      return null;
    }

    const rows = await this.prisma.$queryRaw<VillageNameRow[]>(Prisma.sql`
      SELECT
        vn.id,
        vn.language,
        vn.type,
        vn.value,
        vn.is_current,
        vn.valid_from,
        vn.valid_to,
        vn.meaning_or_origin
      FROM village_names vn
      WHERE vn.village_id = ${village.id}
        AND vn.is_current = TRUE
        AND vn.status = 'verified'
        AND vn.deleted_at IS NULL
      ORDER BY vn.language ASC, vn.type ASC, vn.id ASC
    `);

    return rows.map((row) => this.toItem(row));
  }

  async findHistoryByVillageSlug(
    slug: string
  ): Promise<VillageNameItem[] | null> {
    const village = await this.findPublicVillage(slug);

    if (!village) {
      return null;
    }

    const rows = await this.prisma.$queryRaw<VillageNameRow[]>(Prisma.sql`
      SELECT
        vn.id,
        vn.language,
        vn.type,
        vn.value,
        vn.is_current,
        vn.valid_from,
        vn.valid_to,
        vn.meaning_or_origin
      FROM village_names vn
      WHERE vn.village_id = ${village.id}
        AND vn.deleted_at IS NULL
        AND vn.status IN ('verified', 'superseded')
      ORDER BY vn.valid_from DESC NULLS LAST, vn.id DESC
    `);

    return rows.map((row) => this.toItem(row));
  }

  private async findPublicVillage(
    slug: string
  ): Promise<{ id: bigint } | null> {
    const rows = await this.prisma.$queryRaw<{ id: bigint }[]>(Prisma.sql`
      SELECT v.id
      FROM villages v
      WHERE v.slug = ${slug}
        AND v.status = 'verified'
        AND v.deleted_at IS NULL
      LIMIT 1
    `);

    return rows[0] ?? null;
  }

  private toItem(row: VillageNameRow): VillageNameItem {
    return {
      id: Number(row.id),
      language: row.language,
      type: row.type,
      value: row.value,
      isCurrent: row.is_current,
      validFrom: row.valid_from,
      validTo: row.valid_to,
      meaningOrOrigin: row.meaning_or_origin,
    };
  }
}
